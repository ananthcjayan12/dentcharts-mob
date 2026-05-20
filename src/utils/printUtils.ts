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

export const generateLegacyPdfBlobFromHtml = async (
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
            const scale = pdfWidth / canvasWidth;
            const renderWidth = canvasWidth * scale;
            const renderHeight = canvasHeight * scale;
            const offsetX = 0;
            const offsetY = 0;

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

export const generatePdfBlobFromElementWithRepeatedFooter = async (
    sourceElement: HTMLElement,
    footerSelector: string,
    options?: {
        topMarginMm?: number;
        footerGapMm?: number;
    }
) => {
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
    const topMarginMm = options?.topMarginMm ?? 10;
    const footerGapMm = options?.footerGapMm ?? 3;

    const findWhitespaceBreakRow = (
        canvas: HTMLCanvasElement,
        targetRow: number,
        minRow: number,
        maxRow: number
    ): number => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return targetRow;

        const safeMin = Math.max(0, Math.min(minRow, canvas.height - 1));
        const safeMax = Math.max(safeMin, Math.min(maxRow, canvas.height - 1));
        const bandHeight = safeMax - safeMin + 1;
        if (bandHeight <= 1) return targetRow;

        const imageData = ctx.getImageData(0, safeMin, canvas.width, bandHeight).data;
        const width = canvas.width;
        const strideY = 1;
        const strideX = Math.max(1, Math.floor(width / 220));
        let bestRow = targetRow;
        let bestScore = Number.POSITIVE_INFINITY;

        for (let y = 0; y < bandHeight; y += strideY) {
            let darkSamples = 0;
            let samples = 0;
            const rowOffset = y * width * 4;
            for (let x = 0; x < width; x += strideX) {
                const px = rowOffset + x * 4;
                const r = imageData[px];
                const g = imageData[px + 1];
                const b = imageData[px + 2];
                const brightness = (r + g + b) / 3;
                if (brightness < 245) {
                    darkSamples += 1;
                }
                samples += 1;
            }

            const darknessRatio = samples > 0 ? darkSamples / samples : 1;
            const absoluteRow = safeMin + y;
            const distancePenalty = Math.abs(absoluteRow - targetRow) / 10000;
            const score = darknessRatio + distancePenalty;
            if (score < bestScore) {
                bestScore = score;
                bestRow = absoluteRow;
            }
        }

        return bestRow;
    };

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
        const clone = sourceElement.cloneNode(true) as HTMLElement;
        clone.style.width = '794px';
        clone.style.maxWidth = '794px';
        clone.style.margin = '0';
        clone.style.background = '#ffffff';
        clone.style.boxShadow = 'none';
        clone.style.transform = 'none';
        clone.style.filter = 'none';
        stagingRoot.appendChild(clone);

        const footerNode = clone.querySelector(footerSelector) as HTMLElement | null;
        if (!footerNode) {
            return generatePdfBlobFromElement(clone, 'consent.pdf');
        }

        const footerCanvas = await html2canvas(footerNode, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: Math.max(footerNode.scrollWidth, 794),
            windowHeight: Math.max(footerNode.scrollHeight, 200),
            imageTimeout: 0,
            logging: false,
        });

        const originalFooterDisplay = footerNode.style.display;
        footerNode.style.display = 'none';

        const bodyCanvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: Math.max(clone.scrollWidth, 794),
            windowHeight: Math.max(clone.scrollHeight, 1123),
            imageTimeout: 0,
            logging: false,
        });

        footerNode.style.display = originalFooterDisplay;

        if (!bodyCanvas.width || !bodyCanvas.height) {
            throw new Error('Captured consent content has invalid size');
        }

        const scale = pdfWidth / bodyCanvas.width;
        const footerHeightMm = footerCanvas.height > 0 ? footerCanvas.height * scale : 0;
        const availableBodyHeightMm = Math.max(40, pdfHeight - topMarginMm - footerHeightMm - footerGapMm);
        const pageBodySlicePx = Math.max(1, Math.floor(availableBodyHeightMm / scale));

        let offsetY = 0;
        let pageIndex = 0;
        while (offsetY < bodyCanvas.height) {
            const remaining = bodyCanvas.height - offsetY;
            let sliceHeight = Math.min(pageBodySlicePx, remaining);
            let nextOffset = offsetY + sliceHeight;
            const isBoundaryPage = nextOffset < bodyCanvas.height;
            if (isBoundaryPage) {
                const searchRadiusPx = Math.min(120, Math.floor(pageBodySlicePx * 0.18));
                const minBreak = Math.max(offsetY + Math.floor(pageBodySlicePx * 0.72), nextOffset - searchRadiusPx);
                const maxBreak = Math.min(bodyCanvas.height - 1, nextOffset + searchRadiusPx);
                const adjustedBreak = findWhitespaceBreakRow(bodyCanvas, nextOffset, minBreak, maxBreak);
                if (adjustedBreak > offsetY + 50) {
                    nextOffset = adjustedBreak;
                    sliceHeight = nextOffset - offsetY;
                }
            }

            const isLastPage = nextOffset >= bodyCanvas.height;
            const pageSliceCanvas = document.createElement('canvas');
            pageSliceCanvas.width = bodyCanvas.width;
            pageSliceCanvas.height = sliceHeight;
            const sliceCtx = pageSliceCanvas.getContext('2d');
            if (!sliceCtx) {
                throw new Error('Failed to prepare consent page slice');
            }

            sliceCtx.drawImage(
                bodyCanvas,
                0,
                offsetY,
                bodyCanvas.width,
                sliceHeight,
                0,
                0,
                bodyCanvas.width,
                sliceHeight
            );

            if (pageIndex > 0) {
                pdf.addPage();
            }

            const bodyRenderHeightMm = sliceHeight * scale;
            pdf.addImage(
                pageSliceCanvas.toDataURL('image/jpeg', 0.98),
                'JPEG',
                0,
                topMarginMm,
                pdfWidth,
                bodyRenderHeightMm,
                undefined,
                'FAST'
            );

            if (footerCanvas.height > 0) {
                const minFooterY = topMarginMm + bodyRenderHeightMm + footerGapMm;
                const footerY = isLastPage
                    ? Math.min(pdfHeight - footerHeightMm, minFooterY)
                    : Math.max(minFooterY, pdfHeight - footerHeightMm);
                pdf.addImage(
                    footerCanvas.toDataURL('image/jpeg', 0.98),
                    'JPEG',
                    0,
                    footerY,
                    pdfWidth,
                    footerHeightMm,
                    undefined,
                    'FAST'
                );
            }

            offsetY = nextOffset;
            pageIndex += 1;
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
