// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title DaziSBT — 搭子履约凭证（不可转让）
/// @notice 每一枚凭证只记录"某次线下约定是否按时完成"。
///         它不代表任何人身安全担保，也不代表对方现实中是否可信。
///         对应 PRD R6：元数据只含时间/场景/是否守约，不含对方身份信息。
contract DaziSBT {
    string public constant name = "Dazi Attendance Credential";
    string public constant symbol = "DAZI";

    struct Record {
        uint256 teamId;
        uint8 scene; // 0 = 逛超市, 1 = 同城出行
        bool kept; // 是否守约
        uint64 mintedAt;
    }

    address public admin;
    /// @notice 唯一有权铸造的地址（押金托管合约），设定后不可更改
    address public minter;
    uint256 public totalSupply;

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256[]) private _tokensOf;
    mapping(uint256 => Record) public records;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    /// @dev ERC-5192：铸造即锁定
    event Locked(uint256 tokenId);

    error NotAdmin();
    error NotMinter();
    error MinterAlreadySet();
    error Soulbound();
    error NoSuchToken();

    constructor() {
        admin = msg.sender;
    }

    /// @notice 部署顺序：先部署本合约，再部署 DaziEscrow，最后把 escrow 设为 minter
    function setMinter(address escrow) external {
        if (msg.sender != admin) revert NotAdmin();
        if (minter != address(0)) revert MinterAlreadySet();
        minter = escrow;
    }

    function mint(address to, uint256 teamId, uint8 scene, bool kept) external returns (uint256 tokenId) {
        if (msg.sender != minter) revert NotMinter();
        tokenId = ++totalSupply;
        _ownerOf[tokenId] = to;
        _tokensOf[to].push(tokenId);
        records[tokenId] = Record({teamId: teamId, scene: scene, kept: kept, mintedAt: uint64(block.timestamp)});
        emit Transfer(address(0), to, tokenId);
        emit Locked(tokenId);
    }

    function ownerOf(uint256 tokenId) external view returns (address owner) {
        owner = _ownerOf[tokenId];
        if (owner == address(0)) revert NoSuchToken();
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _tokensOf[owner].length;
    }

    /// @notice 一次性取回某地址的全部履约记录，前端信用分计算直接读这个
    function recordsOf(address owner) external view returns (uint256[] memory ids, Record[] memory items) {
        ids = _tokensOf[owner];
        items = new Record[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            items[i] = records[ids[i]];
        }
    }

    function locked(uint256 tokenId) external view returns (bool) {
        if (_ownerOf[tokenId] == address(0)) revert NoSuchToken();
        return true;
    }

    // ---- 不可转让：所有转移入口一律 revert ----

    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function approve(address, uint256) external pure {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }
}
