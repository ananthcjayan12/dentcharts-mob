// @ts-ignore
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePdfBlobFromHtml = async (
    htmlContent: string,
    filename: string,
) => {
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(htmlContent, 'text/html');
    const element = document.createElement('div');
    const inlineStyles = Array.from(parsedDoc.querySelectorAll('style'))
        .map((styleNode) => styleNode.textContent || '')
        .join('\n');
    element.innerHTML = `${inlineStyles ? `<style>${inlineStyles}</style>` : ''}${parsedDoc.body?.innerHTML || ''}`;
    element.style.position = 'fixed';
    element.style.left = '0';
    element.style.top = '0';
    element.style.width = '794px';
    element.style.maxWidth = '794px';
    element.style.background = '#ffffff';
    element.style.pointerEvents = 'none';
    element.style.zIndex = '-1';
    document.body.appendChild(element);

    try {
        const options: any = {
            margin: 0,
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 794,
            },
            pagebreak: { mode: ['css', 'legacy'] },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };

        return await html2pdf()
            .set(options)
            .from(element)
            .outputPdf('blob');
    } finally {
        if (document.body.contains(element)) {
            document.body.removeChild(element);
        }
    }
};

export const generatePdfBlobFromElement = async (
    sourceElement: HTMLElement,
    filename: string,
) => {
    const options: any = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794,
        },
        pagebreak: { mode: ['css', 'legacy'] },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    return html2pdf()
        .set(options)
        .from(sourceElement)
        .outputPdf('blob');
};

export const generatePdfBlobFromPageElements = async (
    pageElements: HTMLElement[],
    _filename?: string,
) => {
    if (!pageElements.length) {
        throw new Error('No page elements available for PDF generation');
    }

    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    // Render each page from an isolated clone so capture never depends on
    // the live panel's scroll/overflow state.
    const stagingRoot = document.createElement('div');
    stagingRoot.style.position = 'fixed';
    stagingRoot.style.left = '0';
    stagingRoot.style.top = '0';
    stagingRoot.style.width = '794px';
    stagingRoot.style.maxWidth = '794px';
    stagingRoot.style.background = '#ffffff';
    stagingRoot.style.pointerEvents = 'none';
    stagingRoot.style.zIndex = '-1';
    stagingRoot.style.overflow = 'visible';
    document.body.appendChild(stagingRoot);

    try {
        for (let index = 0; index < pageElements.length; index += 1) {
            const pageElement = pageElements[index];
            const pageClone = pageElement.cloneNode(true) as HTMLElement;
            const rect = pageElement.getBoundingClientRect();
            pageClone.style.width = `${Math.max(Math.round(rect.width), 740)}px`;
            pageClone.style.maxWidth = `${Math.max(Math.round(rect.width), 740)}px`;
            pageClone.style.margin = '0';
            pageClone.style.background = '#ffffff';
            pageClone.style.boxShadow = 'none';
            pageClone.style.transform = 'none';
            pageClone.style.filter = 'none';

            stagingRoot.innerHTML = '';
            stagingRoot.appendChild(pageClone);

            const canvas = await html2canvas(pageClone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: 0,
                windowWidth: Math.max(pageClone.scrollWidth, 794),
                windowHeight: Math.max(pageClone.scrollHeight, 1123),
                imageTimeout: 0,
                logging: false,
            });

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            if (!canvasWidth || !canvasHeight) {
                throw new Error('Captured consent page has invalid canvas size');
            }
            const scale = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
            const renderWidth = canvasWidth * scale;
            const renderHeight = canvasHeight * scale;
            const offsetX = (pdfWidth - renderWidth) / 2;
            const offsetY = (pdfHeight - renderHeight) / 2;

            if (index > 0) {
                pdf.addPage();
            }

            pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.98),
                'JPEG',
                offsetX,
                offsetY,
                renderWidth,
                renderHeight,
                undefined,
                'FAST'
            );
        }
    } finally {
        if (document.body.contains(stagingRoot)) {
            document.body.removeChild(stagingRoot);
        }
    }

    return pdf.output('blob');
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
