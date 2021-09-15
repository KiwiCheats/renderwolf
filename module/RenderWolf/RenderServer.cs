using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;

namespace RenderWolf {
    internal class RenderServer {
        internal RenderServer(int pid) {
            var mappingSize = Constants.HeaderSize + Constants.MaximumWidth * Constants.MaximumHeight * 4;

            var mappedFile = MemoryMappedFile.CreateOrOpen($"RenderWolf_{pid}", mappingSize, MemoryMappedFileAccess.ReadWrite);
            var mappedViewStream = mappedFile.CreateViewStream(0, mappingSize);

            _mappedFile = mappedFile;
            _mappedViewStream = mappedViewStream;
            _mapping = mappedViewStream.SafeMemoryMappedViewHandle.DangerousGetHandle();
        }

        ~RenderServer() {
            _mappedViewStream.Dispose();
            _mappedFile.Dispose();
        }

        internal unsafe void Start() {
            var header = (FrameMappingInfo*) _mapping;

            header->FrameTime = 0;
            header->Running = true;
        }

        internal unsafe void Stop() {
            var header = (FrameMappingInfo*) _mapping;

            header->Running = false;
            header->FrameTime = 0;
        }

        internal unsafe void SetInfo(int width, int height) {
            var header = (FrameMappingInfo*) _mapping;

            header->Width = width;
            header->Height = height;
        }

        private unsafe byte[] CreateBitmap(int width, int height, IntPtr data) {
            using var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb);

            var bounds = new Rectangle(0, 0, width, height);

            var bitmapData = bitmap.LockBits(bounds, ImageLockMode.WriteOnly, bitmap.PixelFormat);

            var source = data;
            var destination = bitmapData.Scan0;
            for (var i = 0; i < height; ++i) {
                Buffer.MemoryCopy((void*) source, (void*) destination, (ulong) width * 4, (ulong) width * 4);

                source = IntPtr.Add(source, width * 4);
                destination = IntPtr.Add(destination, bitmapData.Stride);
            }

            bitmap.UnlockBits(bitmapData);

            using var stream = new MemoryStream();
            
            bitmap.Save(stream, ImageFormat.Png);
            
            return stream.ToArray();
        }

        internal unsafe byte[] GetFrame() {
            var header = (FrameMappingInfo*) _mapping;

            var frameTime = header->FrameTime;
            if (_lastFrame != null && frameTime == _lastFrameTime)
                return _lastFrame;

            _lastFrameTime = frameTime;

            var width = header->Width;
            var height = header->Height;

            var frame = CreateBitmap(width, height, GetFrameStart());

            _lastFrame = frame;

            return frame;
        }

        private IntPtr GetFrameStart() {
            return _mapping + 17;
        }
        
        [StructLayout(LayoutKind.Explicit)]
        public struct FrameMappingInfo {
            [FieldOffset(0)] internal bool Running;
            [FieldOffset(1)] internal ulong FrameTime;
            [FieldOffset(9)] internal int Width;
            [FieldOffset(13)] internal int Height;
        }

        private byte[] _lastFrame;
        private ulong _lastFrameTime;

        private readonly MemoryMappedFile _mappedFile;
        private readonly MemoryMappedViewStream _mappedViewStream;
        
        private readonly IntPtr _mapping;
    }
}