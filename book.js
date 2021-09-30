function CheckIsBookLent(bookUUID) {
  var ChkUUID_UUID = opSheet_UUID.getRange(2, 1, opSheet_UUID.getLastRow() - 1).getValues();
  var ChkUUID_UUID_FoundAt = -1;
  ChkUUID_UUID.forEach((element, index) => {
    if (element[0] == bookUUID) {
      ChkUUID_UUID_FoundAt = index + 2;
    }
  });
  return ChkUUID_UUID_FoundAt;
}

function CheckBookExists(bookUUID) {
  var ChkUUID_book = opSheet_book.getRange(2, 2, opSheet_book.getLastRow() - 1).getValues();
  var ChkUUID_book_FoundAt = -1;
  ChkUUID_book.forEach((element, index) => {
    var ChkUUID_book_parse;
    ChkUUID_book_parse = element[0].split(",");
    ChkUUID_book_parse.forEach(element2 => {
      if (element2 == bookUUID) {
        ChkUUID_book_FoundAt = index + 2;
      }
    });
  });
  return ChkUUID_book_FoundAt;
}