function sheet2blob(sheetArr, sheetNameArr) {

    var SheetsObj = {};
    for (var i = 0; i < sheetNameArr.length; i++) {
        SheetsObj[sheetNameArr[i]] = sheetArr[i];
    }

    var workbook = {
        SheetNames: sheetNameArr,
        Sheets: SheetsObj
    };

    var wopts = {
        bookType: 'xlsx',
        bookSST: false,
        type: 'binary'
    };
    var wbout = XLSX.write(workbook, wopts);


    var blob = new Blob([s2ab(wbout)], {
        type: "application/octet-stream"
    });
    function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
    return blob;
}