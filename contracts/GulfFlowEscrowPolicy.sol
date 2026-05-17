// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title GulfFlowEscrowPolicy
/// @notice Minimal milestone escrow policy for a stablecoin trade-finance demo.
/// @dev The MVP records escrow state and emits release events. Production should add audited token custody, roles, KYB providers, and dispute resolution.
contract GulfFlowEscrowPolicy {
    enum Status {
        Draft,
        Locked,
        DocumentsApproved,
        AdvanceReleased,
        Completed,
        Cancelled
    }

    struct Deal {
        address buyer;
        address supplier;
        uint256 invoiceAmountUsdc6;
        uint256 advanceAmountUsdc6;
        bytes32 documentHash;
        string invoiceRef;
        Status status;
        uint256 createdAt;
    }

    mapping(bytes32 => Deal) public deals;

    event DealLocked(
        bytes32 indexed dealId,
        address indexed buyer,
        address indexed supplier,
        string invoiceRef,
        uint256 invoiceAmountUsdc6,
        uint256 advanceAmountUsdc6,
        bytes32 documentHash
    );
    event DocumentsApproved(bytes32 indexed dealId, bytes32 documentHash);
    event AdvanceReleased(bytes32 indexed dealId, address indexed supplier, uint256 advanceAmountUsdc6);
    event DealCompleted(bytes32 indexed dealId);
    event DealCancelled(bytes32 indexed dealId);

    modifier onlyBuyer(bytes32 dealId) {
        require(deals[dealId].buyer == msg.sender, 'only buyer');
        _;
    }

    function lockDeal(
        bytes32 dealId,
        address supplier,
        string calldata invoiceRef,
        uint256 invoiceAmountUsdc6,
        uint256 advanceAmountUsdc6,
        bytes32 documentHash
    ) external {
        require(deals[dealId].buyer == address(0), 'deal exists');
        require(supplier != address(0), 'supplier required');
        require(invoiceAmountUsdc6 > 0, 'invoice required');
        require(advanceAmountUsdc6 > 0 && advanceAmountUsdc6 <= invoiceAmountUsdc6, 'invalid advance');
        require(documentHash != bytes32(0), 'document hash required');

        deals[dealId] = Deal({
            buyer: msg.sender,
            supplier: supplier,
            invoiceAmountUsdc6: invoiceAmountUsdc6,
            advanceAmountUsdc6: advanceAmountUsdc6,
            documentHash: documentHash,
            invoiceRef: invoiceRef,
            status: Status.Locked,
            createdAt: block.timestamp
        });

        emit DealLocked(dealId, msg.sender, supplier, invoiceRef, invoiceAmountUsdc6, advanceAmountUsdc6, documentHash);
    }

    function approveDocuments(bytes32 dealId, bytes32 documentHash) external onlyBuyer(dealId) {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Locked, 'not locked');
        require(deal.documentHash == documentHash, 'document mismatch');
        deal.status = Status.DocumentsApproved;
        emit DocumentsApproved(dealId, documentHash);
    }

    function releaseAdvance(bytes32 dealId) external onlyBuyer(dealId) {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.DocumentsApproved, 'docs not approved');
        deal.status = Status.AdvanceReleased;
        emit AdvanceReleased(dealId, deal.supplier, deal.advanceAmountUsdc6);
    }

    function completeDeal(bytes32 dealId) external onlyBuyer(dealId) {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.AdvanceReleased, 'advance not released');
        deal.status = Status.Completed;
        emit DealCompleted(dealId);
    }

    function cancelDeal(bytes32 dealId) external onlyBuyer(dealId) {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Locked || deal.status == Status.DocumentsApproved, 'cannot cancel');
        deal.status = Status.Cancelled;
        emit DealCancelled(dealId);
    }

    function getDeal(bytes32 dealId) external view returns (Deal memory) {
        return deals[dealId];
    }
}
