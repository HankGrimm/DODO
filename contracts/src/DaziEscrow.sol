// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IDaziSBT {
    function mint(address to, uint256 teamId, uint8 scene, bool kept) external returns (uint256);
}

/// @title DaziEscrow — 搭子组队押金托管 + 双向履约打卡
/// @notice 押金是"参与者对自己履约行为的承诺"，不是第三方对他人行为的下注（PRD 第 8 节 Non-goals）。
///         单方打卡超时不会直接判违约，而是进入"待仲裁"（PRD R5）。
contract DaziEscrow {
    enum Status {
        None,
        Open, // 已发起，等待搭子加入并缴纳押金
        Funded, // 双方押金已托管，等待线下履约打卡
        Completed, // 双方互相打卡成功，押金已退回
        Disputed, // 争议中，等待仲裁（单方打卡超时或有人举报）
        Resolved, // 仲裁已裁决
        Expired // 双方都没出现，押金原路退回
    }

    struct Team {
        address host;
        address guest;
        uint8 scene; // 0 = 逛超市, 1 = 同城出行
        Status status;
        bool hostCheckedIn;
        bool guestCheckedIn;
        uint96 deposit; // 单方押金额度
        uint64 meetAt; // 约定见面时间
        uint64 checkinDeadline; // 打卡截止时间
        bytes32 hostCodeHash; // host 的履约码哈希，由 guest 提交原文来确认
        bytes32 guestCodeHash;
    }

    IDaziSBT public immutable sbt;
    /// @notice 仲裁人。当前为中心化占位实现，对应 PRD 待确认问题 4（谁是最终裁决者尚无答案）。
    address public arbiter;
    uint256 public teamCount;

    mapping(uint256 => Team) public teams;
    mapping(address => uint256[]) private _teamsOf;

    event TeamCreated(uint256 indexed teamId, address indexed host, uint8 scene, uint256 deposit, uint64 meetAt);
    event TeamJoined(uint256 indexed teamId, address indexed guest);
    event CheckedIn(uint256 indexed teamId, address indexed who);
    event TeamCompleted(uint256 indexed teamId);
    event TeamDisputed(uint256 indexed teamId, address indexed raisedBy, string reason);
    event TeamResolved(uint256 indexed teamId, bool hostKept, bool guestKept);
    event TeamExpired(uint256 indexed teamId);
    error NotArbiter();
    error NotParticipant();
    error BadStatus();
    error BadDeposit();
    error BadDeadline();
    error SelfMatch();
    error WrongCode();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error PayoutFailed();

    constructor(address sbtAddress) {
        sbt = IDaziSBT(sbtAddress);
        arbiter = msg.sender;
    }

    /// @param codeHash keccak256(bytes(履约码))，履约码原文只存在于发起人手机上
    function createTeam(uint8 scene, uint64 meetAt, uint64 checkinDeadline, bytes32 codeHash)
        external
        payable
        returns (uint256 teamId)
    {
        if (msg.value == 0 || msg.value > type(uint96).max) revert BadDeposit();
        if (checkinDeadline <= block.timestamp) revert BadDeadline();

        teamId = ++teamCount;
        Team storage t = teams[teamId];
        t.host = msg.sender;
        t.scene = scene;
        t.status = Status.Open;
        t.deposit = uint96(msg.value);
        t.meetAt = meetAt;
        t.checkinDeadline = checkinDeadline;
        t.hostCodeHash = codeHash;
        _teamsOf[msg.sender].push(teamId);

        emit TeamCreated(teamId, msg.sender, scene, msg.value, meetAt);
    }

    function joinTeam(uint256 teamId, bytes32 codeHash) external payable {
        Team storage t = teams[teamId];
        if (t.status != Status.Open) revert BadStatus();
        if (msg.sender == t.host) revert SelfMatch();
        if (msg.value != t.deposit) revert BadDeposit();
        if (t.checkinDeadline <= block.timestamp) revert BadDeadline();

        t.guest = msg.sender;
        t.guestCodeHash = codeHash;
        t.status = Status.Funded;
        _teamsOf[msg.sender].push(teamId);

        emit TeamJoined(teamId, msg.sender);
    }
    /// @notice 双向打卡：提交对方出示的履约码原文（扫码得到），双方都提交成功才算履约
    function checkIn(uint256 teamId, string calldata counterpartCode) external {
        Team storage t = teams[teamId];
        if (t.status != Status.Funded) revert BadStatus();
        if (block.timestamp > t.checkinDeadline) revert DeadlinePassed();

        bytes32 given = keccak256(bytes(counterpartCode));
        if (msg.sender == t.host) {
            if (given != t.guestCodeHash) revert WrongCode();
            t.hostCheckedIn = true;
        } else if (msg.sender == t.guest) {
            if (given != t.hostCodeHash) revert WrongCode();
            t.guestCheckedIn = true;
        } else {
            revert NotParticipant();
        }
        emit CheckedIn(teamId, msg.sender);

        if (t.hostCheckedIn && t.guestCheckedIn) {
            t.status = Status.Completed;
            emit TeamCompleted(teamId);
            _mintBoth(t, teamId, true, true);
            _pay(t.host, t.deposit);
            _pay(t.guest, t.deposit);
        }
    }

    /// @notice 举报：任一方可在履约窗口内发起，进入待仲裁而非直接扣款（PRD R3）
    function raiseDispute(uint256 teamId, string calldata reason) external {
        Team storage t = teams[teamId];
        if (t.status != Status.Funded) revert BadStatus();
        if (msg.sender != t.host && msg.sender != t.guest) revert NotParticipant();
        t.status = Status.Disputed;
        emit TeamDisputed(teamId, msg.sender, reason);
    }

    /// @notice 打卡截止后结算。单方打卡 -> 待仲裁；双方都没打卡 -> 各自退回押金并记一次未履约
    function settleAfterDeadline(uint256 teamId) external {
        Team storage t = teams[teamId];
        if (t.status != Status.Funded) revert BadStatus();
        if (block.timestamp <= t.checkinDeadline) revert DeadlineNotPassed();

        if (t.hostCheckedIn || t.guestCheckedIn) {
            t.status = Status.Disputed;
            emit TeamDisputed(teamId, address(0), "single-side check-in timeout");
            return;
        }
        t.status = Status.Expired;
        emit TeamExpired(teamId);
        _mintBoth(t, teamId, false, false);
        _pay(t.host, t.deposit);
        _pay(t.guest, t.deposit);
    }
    /// @notice 仲裁裁决。失约方的押金赔付给守约方；双方都失约则各自退回。
    ///         证据标准与申诉路径目前在链下（PRD 待确认问题 4），本函数只落地资金与记录结果。
    function resolveDispute(uint256 teamId, bool hostKept, bool guestKept) external {
        if (msg.sender != arbiter) revert NotArbiter();
        Team storage t = teams[teamId];
        if (t.status != Status.Disputed) revert BadStatus();

        t.status = Status.Resolved;
        emit TeamResolved(teamId, hostKept, guestKept);
        _mintBoth(t, teamId, hostKept, guestKept);

        uint256 d = t.deposit;
        if (hostKept && !guestKept) {
            _pay(t.host, d * 2);
        } else if (!hostKept && guestKept) {
            _pay(t.guest, d * 2);
        } else {
            _pay(t.host, d);
            _pay(t.guest, d);
        }
    }

    function teamsOf(address who) external view returns (uint256[] memory) {
        return _teamsOf[who];
    }

    function _mintBoth(Team storage t, uint256 teamId, bool hostKept, bool guestKept) private {
        sbt.mint(t.host, teamId, t.scene, hostKept);
        sbt.mint(t.guest, teamId, t.scene, guestKept);
    }

    function _pay(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert PayoutFailed();
    }
}
