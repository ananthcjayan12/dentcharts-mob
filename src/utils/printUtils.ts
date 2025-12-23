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
