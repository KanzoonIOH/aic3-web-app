import { EmojiPickerPopover } from "@/components/emoji-picker";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Picks an avatar: upload a picture (cropped) or type an emoji.
// - `value` is the persisted image (URL, emoji, or "").
// - `onChange(v)` reports an emoji pick / removal (a string value).
// - `onFile(file)` reports a freshly cropped picture pending upload, or null to
//   clear it. Uploading is the caller's job — done on form submit, never here.
export function AvatarPicker({
    value,
    onChange,
    onFile,
    name,
}: {
    value: string;
    onChange: (v: string) => void;
    onFile: (file: File | null) => void;
    name: string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    // Raw file chosen from disk, awaiting crop (null = cropper closed).
    const [cropFile, setCropFile] = useState<File | null>(null);
    // Preview URL of the last cropped result (overrides `value` visually).
    const [preview, setPreview] = useState<string | null>(null);

    // Revoke preview URLs we created so they don't leak.
    useEffect(() => {
        if (!preview) return;
        return () => URL.revokeObjectURL(preview);
    }, [preview]);

    function handleCropped(file: File) {
        setPreview(URL.createObjectURL(file));
        onFile(file);
        setCropFile(null);
    }

    function clearImage() {
        setPreview(null);
        onFile(null);
        onChange("");
    }

    return (
        <div className="flex flex-col gap-1.5">
            <Label>Avatar</Label>
            <div className="flex items-center gap-3">
                <UserAvatar
                    image={preview ?? value}
                    name={name || "?"}
                    size="lg"
                />
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setCropFile(f);
                            e.target.value = "";
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileRef.current?.click()}
                    >
                        Upload
                    </Button>
                    <EmojiPickerPopover
                        onSelect={(emoji) => {
                            setPreview(null);
                            onFile(null);
                            onChange(emoji);
                        }}
                        trigger={
                            <Button type="button" variant="outline" size="sm">
                                <Smile className="size-4" />
                                Emoji
                            </Button>
                        }
                    />
                    {(preview || value) && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearImage}
                        >
                            Remove
                        </Button>
                    )}
                </div>
            </div>

            <ImageCropDialog
                key={cropFile ? `${cropFile.name}-${cropFile.size}` : "closed"}
                file={cropFile}
                onConfirm={handleCropped}
                onCancel={() => setCropFile(null)}
            />
        </div>
    );
}

// ---------- Image cropper ----------

// Display + output size of the square crop viewport (px).
const CROP_BOX = 256;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

// Modal image cropper: zoom (slider + wheel) and drag-to-pan over a square
// viewport. On confirm, renders the visible region to a canvas and emits a
// square PNG File. ponytail: canvas + pointer events, no crop dependency.
function ImageCropDialog({
    file,
    onConfirm,
    onCancel,
}: {
    file: File | null;
    onConfirm: (cropped: File) => void;
    onCancel: () => void;
}) {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    // Natural dimensions of the loaded image (0 until known).
    const [dims, setDims] = useState({ w: 0, h: 0 });
    // Object URL for the source file, created once per mount. The dialog
    // remounts per file (via key), so StrictMode's mount→unmount→remount makes
    // a fresh URL here instead of reusing a revoked one.
    const [url] = useState(() =>
        file ? URL.createObjectURL(file) : null,
    );
    const imgRef = useRef<HTMLImageElement>(null);
    // In-progress drag state (null = not dragging).
    const dragRef = useRef<{
        startX: number;
        startY: number;
        offX: number;
        offY: number;
    } | null>(null);

    useEffect(() => {
        if (!url) return;
        return () => URL.revokeObjectURL(url);
    }, [url]);

    // coverScale: scale so the image covers the square viewport at zoom 1.
    const coverScale =
        dims.w > 0 && dims.h > 0
            ? Math.max(CROP_BOX / dims.w, CROP_BOX / dims.h)
            : 1;
    // Combined scale applied to the natural-size image.
    const scale = coverScale * zoom;

    // Max pan distance before the image edge enters the viewport (per axis).
    const overflowX = dims.w > 0 ? (dims.w * scale - CROP_BOX) / 2 : 0;
    const overflowY = dims.h > 0 ? (dims.h * scale - CROP_BOX) / 2 : 0;

    const clampOffset = (x: number, y: number) => ({
        x: Math.max(-overflowX, Math.min(overflowX, x)),
        y: Math.max(-overflowY, Math.min(overflowY, y)),
    });

    function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            offX: offset.x,
            offY: offset.y,
        };
    }
    function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        const d = dragRef.current;
        if (!d) return;
        setOffset(
            clampOffset(
                d.offX + (e.clientX - d.startX),
                d.offY + (e.clientY - d.startY),
            ),
        );
    }
    function onPointerUp() {
        dragRef.current = null;
    }

    function onWheel(e: React.WheelEvent<HTMLDivElement>) {
        e.preventDefault();
        setZoom((z) =>
            Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * 0.002)),
        );
    }

    function handleConfirm() {
        const img = imgRef.current;
        if (!img || !dims.w) return;
        const canvas = document.createElement("canvas");
        canvas.width = CROP_BOX;
        canvas.height = CROP_BOX;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingQuality = "high";
        // Source rectangle: which region of the natural image is visible.
        const srcSize = CROP_BOX / scale;
        const srcX = (dims.w - srcSize) / 2 - offset.x / scale;
        const srcY = (dims.h - srcSize) / 2 - offset.y / scale;
        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, CROP_BOX, CROP_BOX);
        canvas.toBlob((blob) => {
            if (!blob) return;
            onConfirm(new File([blob], "avatar.png", { type: "image/png" }));
        }, "image/png");
    }

    return (
        <Dialog open={!!file} onOpenChange={(o) => !o && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crop avatar</DialogTitle>
                    <DialogDescription>
                        Drag to reposition. Use the slider or scroll to zoom.
                    </DialogDescription>
                </DialogHeader>

                <div
                    className="relative mx-auto select-none overflow-hidden rounded-lg border bg-muted touch-none"
                    style={{ width: CROP_BOX, height: CROP_BOX }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                    onWheel={onWheel}
                >
                    {url && (
                        <img
                            ref={imgRef}
                            src={url}
                            alt="Crop preview"
                            draggable={false}
                            onLoad={(e) => {
                                const t = e.currentTarget;
                                setDims({
                                    w: t.naturalWidth,
                                    h: t.naturalHeight,
                                });
                            }}
                            className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
                            style={{
                                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            }}
                        />
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Zoom</span>
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => {
                            const next = Number(e.target.value);
                            setZoom(next);
                            setOffset((o) => clampOffset(o.x, o.y));
                        }}
                        className="flex-1"
                    />
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                        {Math.round(zoom * 100)}%
                    </span>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!dims.w}
                    >
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
