class Account {
    constructor(AccountID, FirstName, LastName, Gender, Birthday, Password, Email, PhoneNumber, Address, Country, City, Province, PotalCode, RoleID, Status, Image) {
        this.AccountID = AccountID;
        this.FirstName = FirstName;
        this.LastName = LastName;
        this.Gender = Gender;
        this.Birthday = Birthday;
        this.Password  = Password;
        this.Email = Email;
        this.PhoneNumber = PhoneNumber;
        this.Address = Address;
        this.Country = Country;
        this.City= City;
        this.Province = Province;
        this.PotalCode = PotalCode;
        this.RoleID = RoleID;
        this.Status = Status;
        this.Image = Image;
    }
}
module.exports = Account;