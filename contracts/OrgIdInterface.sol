// SPDX-License-Identifier: GPL-3.0-only;

pragma solidity 0.6.6;

/**
 * @title ORGiD Registry Smart Contract Interface
 */
interface OrgIdInterface {
    function createOrganization(
        bytes32 salt,
        bytes32 orgJsonHash,
        string calldata orgJsonUri,
        string calldata orgJsonUriBackup1,
        string calldata orgJsonUriBackup2
    ) external returns (bytes32 id);
    function createUnit(
        bytes32 salt,
        bytes32 parentOrgId,
        address director,
        bytes32 orgJsonHash,
        string calldata orgJsonUri,
        string calldata orgJsonUriBackup1,
        string calldata orgJsonUriBackup2
    )
        external
        returns (bytes32 newUnitOrgId);
    function toggleActiveState(bytes32 orgId) external;
    function acceptDirectorship(bytes32 orgId) external;
    function transferDirectorship(
        bytes32 orgId,
        address newDirector
    ) external;
    function renounceDirectorship(bytes32 orgId)
        external;
    function transferOrganizationOwnership(
        bytes32 orgId,
        address newOwner
    ) external;
    function setOrgJson(
        bytes32 orgId,
        bytes32 orgJsonHash,
        string calldata orgJsonUri,
        string calldata orgJsonUriBackup1,
        string calldata orgJsonUriBackup2
    ) external;
    function getOrganizations(bool includeInactive)
        external
        view
        returns (bytes32[] memory organizationsList);
    function getOrganization(bytes32 _orgId)
        external
        view
        returns (
            bool exists,
            bytes32 orgId,
            bytes32 orgJsonHash,
            string memory orgJsonUri,
            string memory orgJsonUriBackup1,
            string memory orgJsonUriBackup2,
            bytes32 parentOrgId,
            address owner,
            address director,
            bool isActive,
            bool isDirectorshipAccepted
        );
    function getUnits(bytes32 parentOrgId, bool includeInactive)
        external
        view
        returns (bytes32[] memory);
}
