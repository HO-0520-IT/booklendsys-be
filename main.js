// set password if you need //
const password = "";
//////////////////////////////

const opFile = SpreadsheetApp.getActiveSpreadsheet();
const opSheet_book = opFile.getSheetByName("BookList");
const opSheet_UUID = opFile.getSheetByName("UUIDList");
const opSheet_user = opFile.getSheetByName("UserList");
const opSheet_temp = opFile.getSheetByName("Temp");

function response(result) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(result));
  return output;
}

function addLog(text/*ログ内容*/) {
  opSheet_temp.appendRow([new Date()/*タイムスタンプ*/,text]);
  return text;
}

function doPost(e) {
  // check JSON
  var input;
  try {
    input = JSON.parse(e.postData.getDataAsString());
  } catch (e) {
    return response({ error : "Invalid data" });
  }
  if (input.password != password) {
    return response({ error : "Auth failed" });
  }
  // mode select
  opmode = input.opmode;
  params = input.params;

  switch (opmode) {
    case "addBook":
      return addBook(params);
    case "deleteBook":
      return deleteBook(params);
    case "addUser":
      return addUser(params);
    case "deleteUser":
      return deleteUser(params);
    case "lendBook":
      return lendBook(params);
    case "returnBook":
      return returnBook(params);
    case "getBookList":
      return getBookList(params);
    default:
      return response({ error : "Invalid opmode" });
  }
}

function addBook(params) {
  var bookStockNum = params.bookStockNum;
  var bookUUID;

  var UUIDArray = new Array(bookStockNum);
  for (let i = 0; i < bookStockNum; i++) {
    UUIDArray[i] = Utilities.getUuid();
  }
  bookUUID = UUIDArray.join(",");

  var bookType = params.bookType;
  var bookID = params.bookID;
  var bookTitle = params.bookTitle;
  var bookAuthor = params.bookAuthor;
  var bookPublishedYear = params.bookPublishedYear;
  var bookPublishedMonth = params.bookPublishedMonth;
  var bookDesc = params.bookDesc;
  var bookImageURL = params.bookImageURL;
  var bookAddedBy = params.bookAddedBy;
  var bookComment = params.bookComment;
  // var isLent = params.isLent;

  opSheet_book.appendRow([bookStockNum, bookUUID, bookType, bookID, bookTitle, bookAuthor, bookPublishedYear, bookPublishedMonth, bookDesc, bookImageURL, bookAddedBy, bookComment]);
  for (i = 0; i < bookStockNum; i++) {
    opSheet_UUID.appendRow([UUIDArray[i], -1]);
  }
  return response({ success : bookStockNum, UUID : UUIDArray });
}

function deleteBook(params) {
  var bookUUID = params.bookUUID;

  var ChkUUID_UUID_FoundAt = CheckIsBookLent(bookUUID);
  var ChkUUID_book_FoundAt = CheckBookExists(bookUUID);

  if (ChkUUID_UUID_FoundAt == -1 || ChkUUID_book_FoundAt == -1) {
    return response({ error : "UUID not found" });
  }
  if (opSheet_UUID.getRange(ChkUUID_UUID_FoundAt, 2) != "-1") {
    return response({ error : "Book still lent" });
  }

  opSheet_UUID.deleteRows(ChkUUID_UUID_FoundAt);
  var bookStockNum = parseInt(opSheet_book.getRange(ChkUUID_book_FoundAt, 1));
  if (bookStockNum > 1) {
    var UUIDArray = new Array(bookStockNum);
    var bookUUID2 = opSheet_book.getRange(ChkUUID_book_FoundAt, 2);
    UUIDArray = bookUUID2.split(",");
    var UUIDArray2 = UUIDArray.filter(element => {
      if (element == bookUUID) {
        element = null;
      }
    });

    bookUUID2 = UUIDArray2.join(",");
    opSheet_book.getRange(ChkUUID_book_FoundAt, 2).setValue(bookUUID2);

    bookStockNum--;
    opSheet_book.getRange(ChkUUID_book_FoundAt, 1).setValue(bookStockNum);

  } else {
    opSheet_book.deleteRows(ChkUUID_book_FoundAt);
  }
  return response({ success : bookUUID });
}

function addUser(params) {
  var userID = params.userID;
  var ChkUserID = opSheet_user.getRange(2, 1, opSheet_user.getLastRow - 1);
  if (ChkUserID.includes(userID) || ChkUserID.includes("-1")) {
    return response({ error : "UserID duplicated" });
  }
  var userName = params.userName;
  var userDesc = params.userDesc;
  var userImageURL = params.userImageURL;
  var userAddDate = params.userAddDate;

  opSheet_user.appendRow([userID, userName, userDesc, userImageURL, userAddDate]);
  return response({ success : userID });
}

function deleteUser(params) {
  var userID = params.userID;

  var ChkuserID_UUID_FoundAt = CheckUserBorrowsBook(userID);
  var ChkuserID_user_FoundAt = CheckUserExists(userID);

  if (ChkuserID_user_FoundAt == -1) {
    return response({ error : "UserID not found" });
  }
  if (ChkuserID_UUID_FoundAt != []) {
    return response({ error : "Book still lent" });
  }

  opSheet_user.deleteRows(ChkuserID_user_FoundAt);
  return response({ success : userID });
}

function lendBook(params) {
  var bookUUID = params.bookUUID;
  var userID = params.userID;

  var ChkUUID_book_FoundAt = CheckBookExists(bookUUID);
  var ChkUUID_UUID_FoundAt = CheckIsBookLent(bookUUID);

  if (ChkUUID_UUID_FoundAt == -1 || ChkUUID_book_FoundAt == -1) {
    return response({ error : "UUID not found" });
  }
  if (opSheet_UUID.getRange(ChkUUID_UUID_FoundAt, 2).getValues() != "-1") {
    return response({ error : "Book still lent" });
  }

  var ChkuserID_user_FoundAt = CheckUserExists(userID);

  if (ChkuserID_user_FoundAt == -1 || userID == "") {
    return response({ error : "UserID not found" });
  }

  opSheet_UUID.getRange(ChkUUID_UUID_FoundAt, 2).setValue(userID);
  return response({ success : userID });
}

function returnBook(params) {
  var bookUUID = params.bookUUID;

  var ChkUUID_book_FoundAt = CheckBookExists(bookUUID);
  var ChkUUID_UUID_FoundAt = CheckIsBookLent(bookUUID);

  if (ChkUUID_UUID_FoundAt == -1 || ChkUUID_book_FoundAt == -1) {
    return response({ error : "UUID not found" });
  }
  if (opSheet_UUID.getRange(ChkUUID_UUID_FoundAt, 2) == "-1") {
    return response({ error : "Book not lent" });
  }

  /*
    var ChkuserID_user_FoundAt = CheckUserExists(userID);
    var ChkuserID_UUID_FoundAt = CheckUserBorrowsBook(userID);

    //Check what book is lent by that user
    var ChkuserID_UUID_BookUUID = ChkuserID_UUID_FoundAt.filter(element => {
      return opSheet_UUID.getRange(element, 1);
    });

    if (ChkuserID_user_FoundAt == -1) {
      return response({ error : "UserID not found" });
    }
    //Check whether the book is lent by that user
    if (!ChkuserID_UUID_BookUUID.includes(bookUUID)) {
      return response({ error : "Book not lent" });
    }
  */

  opSheet_UUID.getRange(ChkUUID_UUID_FoundAt, 2).setValue(-1);
  return response({ success : bookUUID });
}

function getBookList(params) {
  var bookListStartsAt = parseInt(params.bookListStartsAt); //0, 1, 2, ...
  if (bookListStartsAt < 0) {
    bookListStartsAt = 0;
  }
  var bookListEndsAt = parseInt(params.bookListEndsAt);
  if (bookListEndsAt == -1 || bookListEndsAt > opSheet_book.getLastRow() - 2) {
    bookListEndsAt = opSheet_book.getLastRow() - 2;
  }
  if (bookListEndsAt < bookListStartsAt) {
    return response({success : 0, list : null});
  }

  var bookListAll = opSheet_book.getDataRange().getValues();
  var bookListKey = bookListAll[0].filter(element => {
    return element;
  });
  bookListAll = bookListAll.slice(1);

  var UUIDListAll = opSheet_UUID.getDataRange().getValues().slice(1);
  var UUIDListObj = {};
  UUIDListAll.forEach(element => {
    UUIDListObj[element[0]] = element[1];
  });

  var bookListObj = {success : bookListEndsAt - bookListStartsAt + 1, list : []};
  for (i = bookListStartsAt ; i <= bookListEndsAt; i++) {
    var jsondata = {};
    bookListAll[i].forEach((element, index) => {
      if (bookListKey[index] == "UUID") {
        var UUIDList = element.split(",");
        jsondata["UUIDList"] = [];
        UUIDList.forEach((element2, index2) => {
          var jsondata2 = {};
          jsondata2["UUID"] = element2;
          jsondata2["isLent"] = UUIDListObj[element2];
          jsondata["UUIDList"].push(jsondata2);
        });
      } else {
        jsondata[bookListKey[index]] = element;
      }
    });
    bookListObj["list"].push(jsondata);
  }
  return response(bookListObj);
}