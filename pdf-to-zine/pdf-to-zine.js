// Import the PDF.js library

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function () {
    convertToZine(reader.result);
  };
  reader.readAsArrayBuffer(file);
}

function roundUpToMultipleOf4(num) {
  return Math.ceil(num / 4) * 4;
}

function generateOrder(numPages) {
  const max = roundUpToMultipleOf4(numPages) - 1;
  const order = [];
  let flip = false;
  for (let i = 0; i < max / 2; i++) {
    if (flip) {
      order.push([i, max - i]);
    } else {
      order.push([max - i, i]);
    }
    flip = !flip;
  }

  return order.map((x) => x.map((x) => x + 1)); // because pdfjsLib is dumb..
}

function convertToZine(pdfData) {
  // Load the input PDF document
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  loadingTask.promise.then(async (pdf) => {
    // Create a new empty PDF document
    const newPdf = new jspdf.jsPDF();
    const newWidth = newPdf.internal.pageSize.width * 0.75;
    const newHeight = newPdf.internal.pageSize.height * 0.75;
    const order = generateOrder(pdf.numPages);

    // Split the input PDF pages into two-page spreads
    const promises = order.map(async ([page1Index, page2Index]) => {
      const page1 =
        page1Index >= pdf.numPages
          ? await pdf.getPage(1)
          : await pdf.getPage(page1Index);
      const page2 =
        page2Index >= pdf.numPages
          ? await pdf.getPage(1)
          : await pdf.getPage(page2Index);
      // Merge the two pages into a new page in the new PDF document
      const canvas1 = document.createElement("canvas");
      const canvas2 = document.createElement("canvas");
      const viewport1 = page1.getViewport({ scale: 1 });
      const viewport2 = page2.getViewport({ scale: 1 });
      canvas1.height = viewport1.height;
      canvas1.width = viewport1.width;
      canvas2.height = viewport2.height;
      canvas2.width = viewport2.width;
      const renderContext1 = {
        canvasContext: canvas1.getContext("2d"),
        viewport: viewport1,
      };
      const renderContext2 = {
        canvasContext: canvas2.getContext("2d"),
        viewport: viewport2,
      };
      await page1.render(renderContext1).promise;
      await page2.render(renderContext2).promise;

      newPdf.addPage();
      newPdf.addImage(
        canvas1.toDataURL("image/jpeg"),
        "JPEG",
        0,
        -newPdf.internal.pageSize.height * 0.75,
        newWidth,
        newHeight,
        null,
        null,
        -90
      );
      newPdf.addImage(
        canvas2.toDataURL("image/jpeg"),
        "JPEG",
        0,
        -newPdf.internal.pageSize.height * 0.25,
        newWidth,
        newHeight,
        null,
        null,
        -90
      );
    });

    await Promise.all(promises);

    downloadPDF(newPdf);
  });
}

function downloadPDF(pdf) {
  // Convert the PDF to a binary array
  const pdfData = pdf.output("arraybuffer");

  // Create a new blob from the binary data
  const blob = new Blob([pdfData], { type: "application/pdf" });

  // Create a download link for the blob
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "zine.pdf";
  document.body.appendChild(link);

  // Click the download link to trigger the download
  link.click();

  // Clean up the URL object and download link
  URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

const input = document.getElementById("file-input");

input.onchange = handleFileSelect;
