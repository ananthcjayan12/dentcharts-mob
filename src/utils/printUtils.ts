// @ts-ignore
import html2pdf from 'html2pdf.js';

export const generatePdfBlobFromHtml = async (
    htmlContent: string,
    filename: string,
) => {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    return html2pdf()
        .set({
            margin: 0,
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .outputPdf('blob');
};

export const printHTML = (htmlContent: string) => {
    // Create a hidden iframe
    const iframe = document.createElement('iframe');

    // Hide the iframe completely
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden'; // Ensure it's not visible

    // Appending to body
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Wait for content to load
        iframe.onload = () => {
            // Small delay to ensure styles/fonts render properly
            setTimeout(() => {
                try {
                    iframe.contentWindow?.focus(); // Focus needed for some browsers
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print failed', e);
                } finally {
                    // Clean up the iframe after a delay
                    // We wait longer to ensure print dialog has initialized
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 2000);
                }
            }, 500);
        };
    }
};
