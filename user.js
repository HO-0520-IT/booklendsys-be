function CheckUserBorrowsBook(userID) {
  var ChkuserID_UUID = opSheet_UUID.getRange(2, 2, opSheet_UUID.getLastRow() - 1).getValues();
  var ChkuserID_UUID_FoundAt = [];
  ChkuserID_UUID.forEach((element, index) => {
    if (element[0] == userID) {
      ChkuserID_UUID_FoundAt.push(index + 2);
    }
  });
  return ChkuserID_UUID_FoundAt;
}

function CheckUserExists(userID) {
  var ChkuserID_user = opSheet_user.getRange(2, 1, opSheet_book.getLastRow() - 1).getValues();
  var ChkuserID_user_FoundAt = -1;
  ChkuserID_user.forEach((element, index) => {
    if (element[0] == userID) {
      ChkuserID_user_FoundAt = index + 2;
    }
  });
  return ChkuserID_user_FoundAt;
}