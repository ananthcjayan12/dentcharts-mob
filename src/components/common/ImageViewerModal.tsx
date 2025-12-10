import React, { useState, useRef, useEffect, TouchEvent } from 'react';

interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: Array<{ url: string; caption?: string }>;
    initialIndex?: number;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
    isOpen,
    onClose,
    images,
    initialIndex = 0
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Touch handling for pinch zoom
    const [touchDistance, setTouchDistance] = useState(0);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        // Reset zoom when changing images
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [currentIndex]);

    const getTouchDistance = (touch1: Touch, touch2: Touch) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch zoom start
            const distance = getTouchDistance(e.touches[0] as Touch, e.touches[1] as Touch);
            setTouchDistance(distance);
        } else if (e.touches.length === 1 && scale > 1) {
            // Drag start when zoomed
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2 && touchDistance > 0) {
            // Pinch zoom
            e.preventDefault();
            const newDistance = getTouchDistance(e.touches[0] as Touch, e.touches[1] as Touch);
            const scaleChange = newDistance / touchDistance;
            const newScale = Math.min(Math.max(scale * scaleChange, 1), 5);
            setScale(newScale);
            setTouchDistance(newDistance);
        } else if (isDragging && e.touches.length === 1) {
            // Drag image when zoomed
            e.preventDefault();
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) {
            setTouchDistance(0);
        }
        if (e.touches.length === 0) {
            setIsDragging(false);

            // Swipe to next/previous if not zoomed and drag was horizontal
            if (scale === 1 && Math.abs(position.x) > 50) {
                if (position.x > 50 && currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                } else if (position.x < -50 && currentIndex < images.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                }
            }
            setPosition({ x: 0, y: 0 });
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = Math.min(Math.max(scale - e.deltaY * 0.01, 1), 5);
        setScale(newScale);
        if (newScale === 1) {
            setPosition({ x: 0, y: 0 });
        }
    };

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur">
                <div className="text-white">
                    <p className="text-sm font-medium">
                        {currentIndex + 1} / {images.length}
                    </p>
                    {currentImage.caption && (
                        <p className="text-xs text-gray-300">{currentImage.caption}</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Image Container */}
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden flex items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
            >
                <img
                    ref={imageRef}
                    src={currentImage.url}
                    alt={currentImage.caption || `Image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain select-none touch-none"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    draggable={false}
                />

                {/* Navigation Arrows - Desktop */}
                {images.length > 1 && (
                    <>
                        {currentIndex > 0 && (
                            <button
                                onClick={handlePrevious}
                                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        {currentIndex < images.length - 1 && (
                            <button
                                onClick={handleNext}
                                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </>
                )}

                {/* Zoom indicator */}
                {scale > 1 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {Math.round(scale * 100)}%
                    </div>
                )}
            </div>

            {/* Footer - Mobile Navigation */}
            {images.length > 1 && (
                <div className="md:hidden flex items-center justify-center gap-4 px-4 py-3 bg-black/80 backdrop-blur">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="text-white p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex gap-2">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === images.length - 1}
                        className="text-white p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Instructions */}
            <div className="md:hidden absolute bottom-20 left-0 right-0 text-center text-white/70 text-xs px-4">
                <p>Pinch to zoom • Swipe to navigate</p>
            </div>
        </div>
    );
};

export default ImageViewerModal;
