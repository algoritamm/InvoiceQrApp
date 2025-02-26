///Form element
const formGetInvoiceData = document.getElementById('getInvoceDataForm');

if(!formGetInvoiceData) {
    Neutralino.debug.log("Form element doesn't exists.", "WARNING");
    alert("Error loading form resources...");
}   

///Toast classification
const toastBackground = {
    success: "linear-gradient(to right, #00b09b, #96c93d)",
    error: "linear-gradient(to right, #ff5f6d, #ffc371)",
    warning: "linear-gradient(to right,rgb(255, 204, 95),rgb(252, 242, 100))"
};

///Loader
function showLoader() {
    document.getElementById('loader').removeAttribute('hidden');
}
function hideLoader() {
    document.getElementById('loader').setAttribute('hidden', '');
}

///URL validation
function isValidURL(url) {
    try {
        new URL(url);

        const matches = url.match(new RegExp("http", 'g'));
        var numberOfProtocols = matches ? matches.length : 0;
        return numberOfProtocols === 1;

    } catch(error) {
        console.log(error)
        Neutralino.debug.log(`URL isn't valid: ${error.message}`, "WARNING");
        return false;
    }
}

///HTTP GET request
async function sendRequestAndGetDetails(url) {
    const command = `curl -H "Accept: application/json" -H "Content-Type: application/json; charset=utf-8" "${url}"`;
    try {
        const response = await Neutralino.os.execCommand(command);
        
        if (!response || response?.stdOut.trim() === "") {
            console.error('HTTP sending request error:', response.stdErr);
            Neutralino.debug.log(`${error.stdErr}`, "ERROR");
            return null;
        }
        
        const data = JSON.parse(response.stdOut);
        Neutralino.debug.log(`Http response: ${data}`);
        return data;
    } catch (error) {
        console.error(`Error while loading data: ${error.message}`);
        Neutralino.debug.log(`${error.message}`, "ERROR");
        return null;
    }
}

///Load data from response
async function createUpdateExcelFile(jsonData) {
    if (!jsonData) throw new Error("Data isn't valid.");
    
    try {
        const dataRow = {
            "ПИБ": jsonData.invoiceRequest.taxId,
            "Име продајног места": jsonData.invoiceRequest.locationName,
            "Адреса": jsonData.invoiceRequest.address,
            "Укупан износ": jsonData.invoiceResult.totalAmount,
            "Бројач по врсти трансакције": jsonData.invoiceResult.transactionTypeCounter,
            "Бројач укупног броја": jsonData.invoiceResult.totalCounter,
            "Екстензија бројача рачуна": jsonData.invoiceResult.invoiceCounterExtension,
            "ПФР време": jsonData.invoiceResult.sdcTime.replace("Z", "").replace("T", " ")
        };
    
        const date = new Date();
        const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const filename = `InvoceData_${formattedDate}.xlsx`;
        const path = await Neutralino.os.getPath('downloads');
        const filePath = `${path}/${filename}`;
        console.log(filePath)
        Neutralino.debug.log(`Download file path: ${filePath}`);
        let wb, ws;
        const fileExists = await Neutralino.filesystem.readDirectory(path) 
            .then(files => files.some(file => file.entry === filename))
            .catch(() => false);
    
        if (fileExists) {
            //If file exist uppend new row
            const existingFile = await Neutralino.filesystem.readBinaryFile(filePath);
            const workbook = XLSX.read(existingFile, { type: 'array' });
            ws = workbook.Sheets[workbook.SheetNames[0]];
            XLSX.utils.sheet_add_json(ws, [dataRow], { skipHeader: true, origin: -1 });
            wb = workbook;    
        } else {
            //if file doesn't exist create new
            ws = XLSX.utils.json_to_sheet([dataRow]);
            wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet");
        }
        //console.log(wb)
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        await Neutralino.filesystem.writeBinaryFile(filePath, wbout);
        
        let pathParts = await Neutralino.filesystem.getPathParts(filePath);
        return pathParts.relativePath;

    } catch(error) {
        Neutralino.debug.log(`${error.message}`, "ERROR");
        throw new Error(`Error:| ${error}.`);
    }      
}

///Create toast alert notification
function showToast(message, type) {
    Toastify({
        text: message,
        duration: 2000,
        close: false,
        style: { background: toastBackground[type] }
    }).showToast();
}

///Main function
formGetInvoiceData.addEventListener('submit', async function (event) {
    event.preventDefault();
    const inputUrl = document.getElementById('urlInput');
    const url = inputUrl.value.trim();

    showLoader();
    try {
        if (!isValidURL(url)) {
            Neutralino.debug.log(`The url isn't valid`, "WARNING");
            showToast("The url isn't valid.", "warning");
            return;
        }
        
        const data = await sendRequestAndGetDetails(url);
        if (data) {
            var createdFile = await createUpdateExcelFile(data);
            showToast(`Successfully loaded data ${createdFile}.`, "success");
        }
        else {
            showToast("Error while loading data.", "error");
            Neutralino.debug.log(`Error while loading data.`, "ERROR");
        }
    } catch (error) {
        console.error(error);
        Neutralino.debug.log(`${error.message}`, "ERROR");
        showToast("An error occurred. Please try again.", "error");
    } finally {
        hideLoader();
        formGetInvoiceData.reset();
    }
});