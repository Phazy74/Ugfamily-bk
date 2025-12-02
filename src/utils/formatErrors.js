export function formatValidationErrors(errors) {
  return errors.map(err => {
    switch (err.path) {
      case "personalInfo.legalFirstName":
        return "Please enter your first name";
      case "personalInfo.middleName":
        return "Please enter your middle name";
      case "personalInfo.legalLastName":
        return "Please enter your last name";
      case "personalInfo.username":
        return "Invalid username format";
      case "contactDetail.email":
        return "Please enter a valid email address";
      case "contactDetail.phone":
        return "Please enter a valid phone number";
      case "contactDetail.country":
        return "Please select your country";
      case "accountSetup.accountType":
        return "Please choose an account type";
      case "accountSetup.transactionPin":
        return "Transaction PIN must be 4 digits";
      case "security.password":
        return "Password does not meet security requirements";
      case "security.confirmPassword":
        return "Passwords do not match";
      case "security.acceptTerms":
        return "You must accept the Terms and Privacy Policy";
      default:
        return err.msg || "Invalid input";
    }
  });
}
