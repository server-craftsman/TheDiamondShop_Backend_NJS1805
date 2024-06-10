class Roles {
    constructor(RoleID, RoleName, Transportation, BonusPoints, NumberOfOrdersDelivered, Rank) {
        this.RoleID = RoleID;
        this.RoleName = RoleName;
        this.Transportation = Transportation;
        this.BonusPoints = BonusPoints;
        this.NumberOfOrdersDelivered = NumberOfOrdersDelivered;
        this.Rank = Rank;
    }
}
module.exports = Roles;