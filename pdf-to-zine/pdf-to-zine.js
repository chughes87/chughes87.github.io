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
var dfData = atob(
  "JVBERi0xLjMKJbrfrOAKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL1Jlc291cmNlcyAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUuMjc5OTk5OTk5OTk5OTcyNyA4NDEuODg5OTk5OTk5OTk5OTg2NF0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggMjQKPj4Kc3RyZWFtCjAuNTY3MDAwMDAwMDAwMDAwMSB3CjAgRwplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwvVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSIF0KL0NvdW50IDEKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9IZWx2ZXRpY2EKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9IZWx2ZXRpY2EtT2JsaXF1ZQovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iago4IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGRPYmxpcXVlCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjEwIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvQ291cmllci1Cb2xkCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjExIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvQ291cmllci1PYmxpcXVlCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjEyIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvQ291cmllci1Cb2xkT2JsaXF1ZQovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxMyAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1RpbWVzLVJvbWFuCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjE0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtQm9sZAovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxNSAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1RpbWVzLUl0YWxpYwovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxNiAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1RpbWVzLUJvbGRJdGFsaWMKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTcgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9aYXBmRGluZ2JhdHMKL1N1YnR5cGUgL1R5cGUxCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTggMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9TeW1ib2wKL1N1YnR5cGUgL1R5cGUxCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMiAwIG9iago8PAovUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0KL0ZvbnQgPDwKL0YxIDUgMCBSCi9GMiA2IDAgUgovRjMgNyAwIFIKL0Y0IDggMCBSCi9GNSA5IDAgUgovRjYgMTAgMCBSCi9GNyAxMSAwIFIKL0Y4IDEyIDAgUgovRjkgMTMgMCBSCi9GMTAgMTQgMCBSCi9GMTEgMTUgMCBSCi9GMTIgMTYgMCBSCi9GMTMgMTcgMCBSCi9GMTQgMTggMCBSCj4+Ci9YT2JqZWN0IDw8Cj4+Cj4+CmVuZG9iagoxOSAwIG9iago8PAovUHJvZHVjZXIgKGpzUERGIDIuNS4xKQovQ3JlYXRpb25EYXRlIChEOjIwMjMwMzMwMjI0NDUzLTA3JzAwJykKPj4KZW5kb2JqCjIwIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAxIDAgUgovT3BlbkFjdGlvbiBbMyAwIFIgL0ZpdEggbnVsbF0KL1BhZ2VMYXlvdXQgL09uZUNvbHVtbgo+PgplbmRvYmoKeHJlZgowIDIxCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDIyNiAwMDAwMCBuIAowMDAwMDAyMDQzIDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDE1MiAwMDAwMCBuIAowMDAwMDAwMjgzIDAwMDAwIG4gCjAwMDAwMDA0MDggMDAwMDAgbiAKMDAwMDAwMDUzOCAwMDAwMCBuIAowMDAwMDAwNjcxIDAwMDAwIG4gCjAwMDAwMDA4MDggMDAwMDAgbiAKMDAwMDAwMDkzMSAwMDAwMCBuIAowMDAwMDAxMDYwIDAwMDAwIG4gCjAwMDAwMDExOTIgMDAwMDAgbiAKMDAwMDAwMTMyOCAwMDAwMCBuIAowMDAwMDAxNDU2IDAwMDAwIG4gCjAwMDAwMDE1ODMgMDAwMDAgbiAKMDAwMDAwMTcxMiAwMDAwMCBuIAowMDAwMDAxODQ1IDAwMDAwIG4gCjAwMDAwMDE5NDcgMDAwMDAgbiAKMDAwMDAwMjI5MSAwMDAwMCBuIAowMDAwMDAyMzc3IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgMjEKL1Jvb3QgMjAgMCBSCi9JbmZvIDE5IDAgUgovSUQgWyA8OEVFOEQ4MDUzMkJGNjdEQ0JCODBBMDRCRjkzQUM0OTI+IDw4RUU4RDgwNTMyQkY2N0RDQkI4MEEwNEJGOTNBQzQ5Mj4gXQo+PgpzdGFydHhyZWYKMjQ4MQolJUVPRg=="
);

function convertToZine(pdfData) {
  // Load the input PDF document
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const loadingTask2 = pdfjsLib.getDocument({ data: dfData });
  Promise.all([loadingTask.promise, loadingTask2.promise]).then(
    async ([pdf, blank]) => {
      const blankPage = blank.getPage(1);
      // Create a new empty PDF document
      const newPdf = new jspdf.jsPDF();
      const newWidth = newPdf.internal.pageSize.width * 0.75;
      const newHeight = newPdf.internal.pageSize.height * 0.75;
      const order = generateOrder(pdf.numPages);

      // Split the input PDF pages into two-page spreads
      const promises = order.map(async ([page1Index, page2Index]) => {
        const page1 =
          page1Index >= pdf.numPages
            ? await blankPage
            : await pdf.getPage(page1Index);
        const page2 =
          page2Index >= pdf.numPages
            ? await blankPage
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
    }
  );
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
