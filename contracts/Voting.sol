// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Decentralized Voting Smart Contract
 * @author Cryptocurrency Fundamentals Course
 * @notice Demonstrates Ethereum state storage, access control, transaction gas, and anti-double-voting mechanisms.
 * @dev Implements a transparent election system with candidate registration, single-vote verification, and result aggregation.
 */
contract Voting {
    /// @notice Contract administrator address permitted to register candidates.
    address public owner;

    /// @notice Struct representing a registered candidate in the election.
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    /// @notice Ordered list of all candidates participating in the election.
    Candidate[] public candidates;

    /// @notice Tracks whether an Ethereum address has already cast a ballot.
    mapping(address => bool) public hasVoted;

    /// @notice Maps a voter address to their selected candidate ID.
    mapping(address => uint256) public voterChoice;

    /// @notice Total ballots submitted across the entire election.
    uint256 public totalVotes;

    /// @notice Boolean flag indicating whether voting is currently active.
    bool public votingOpen;

    /// @notice Emitted when the contract owner registers a new candidate.
    /// @param candidateId The numerical identifier assigned to the new candidate.
    /// @param name The name of the registered candidate.
    event CandidateAdded(uint256 indexed candidateId, string name);

    /// @notice Emitted when a voter successfully casts a ballot.
    /// @param voter The Ethereum address of the voter.
    /// @param candidateId The numerical identifier of the chosen candidate.
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    /// @notice Emitted when the owner toggles the voting status.
    /// @param isOpen The new voting state.
    event VotingStatusChanged(bool isOpen);

    /// @dev Restricts function execution exclusively to the contract deployer/owner.
    modifier onlyOwner() {
        require(msg.sender == owner, "Voting: Only contract owner can execute this action");
        _;
    }

    /// @dev Ensures voting is active before accepting ballots.
    modifier onlyWhileOpen() {
        require(votingOpen, "Voting: Voting is currently closed");
        _;
    }

    /**
     * @notice Initializes the voting contract with an initial list of candidate names.
     * @dev Sets the deployer as contract owner and enables voting by default.
     * @param initialCandidateNames Array of candidate names to register upon deployment.
     */
    constructor(string[] memory initialCandidateNames) {
        owner = msg.sender;
        votingOpen = true;

        for (uint256 i = 0; i < initialCandidateNames.length; i++) {
            _addCandidate(initialCandidateNames[i]);
        }
    }

    /**
     * @notice Registers a new candidate into the election.
     * @dev Accessible only by the contract owner.
     * @param name The string name of the candidate to add.
     */
    function addCandidate(string memory name) external onlyOwner {
        require(bytes(name).length > 0, "Voting: Candidate name cannot be empty");
        _addCandidate(name);
    }

    /**
     * @dev Internal helper to append a candidate and emit the CandidateAdded event.
     */
    function _addCandidate(string memory name) internal {
        uint256 candidateId = candidates.length;
        candidates.push(Candidate({
            id: candidateId,
            name: name,
            voteCount: 0
        }));
        emit CandidateAdded(candidateId, name);
    }

    /**
     * @notice Casts a single vote for a specified candidate.
     * @dev Enforces one-person-one-vote via the hasVoted mapping and updates state.
     * @param candidateId The numerical index of the desired candidate.
     */
    function vote(uint256 candidateId) external onlyWhileOpen {
        require(!hasVoted[msg.sender], "Voting: Sender has already cast a vote");
        require(candidateId < candidates.length, "Voting: Invalid candidate ID");

        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = candidateId;
        candidates[candidateId].voteCount += 1;
        totalVotes += 1;

        emit VoteCast(msg.sender, candidateId);
    }

    /**
     * @notice Retrieves aggregated election results.
     * @dev View function requiring zero gas when called off-chain via eth_call.
     * @return names Array of all candidate names.
     * @return voteCounts Corresponding array of received vote totals.
     */
    function getResults() external view returns (string[] memory names, uint256[] memory voteCounts) {
        uint256 count = candidates.length;
        names = new string[](count);
        voteCounts = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            names[i] = candidates[i].name;
            voteCounts[i] = candidates[i].voteCount;
        }
        return (names, voteCounts);
    }

    /**
     * @notice Returns total number of registered candidates.
     * @return Total candidate count.
     */
    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    /**
     * @notice Returns data for a specific candidate by index.
     * @param candidateId The index of the candidate.
     * @return id Candidate numerical ID.
     * @return name Candidate name.
     * @return voteCount Total votes received.
     */
    function getCandidate(uint256 candidateId) external view returns (
        uint256 id,
        string memory name,
        uint256 voteCount
    ) {
        require(candidateId < candidates.length, "Voting: Invalid candidate ID");
        Candidate memory c = candidates[candidateId];
        return (c.id, c.name, c.voteCount);
    }

    /**
     * @notice Toggles the voting status between active and closed.
     * @param isOpen Desired boolean state.
     */
    function setVotingStatus(bool isOpen) external onlyOwner {
        votingOpen = isOpen;
        emit VotingStatusChanged(isOpen);
    }
}
