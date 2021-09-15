using System;

namespace RenderWolf {
    public class RenderWolfPlugin {
        public void Start() {
            if (_context is null) {
                _context = new RenderServer(0);
                _context.Start();
            }
        }

        public void Stop() {
            if (_context is not null) {
                _context.Stop();
                _context = null;
            }
        }
        
        public void SetInfo(int width, int height) {
            _context?.SetInfo(width, height);
        }

        public string Frame() {
            if (_context is null)
                return String.Empty;

            var frame = _context.GetFrame();
            
            var encodedFrame = _encodedFrame;
            if (frame != _lastFrame) {
                encodedFrame =  $"data:image/png;base64, {Convert.ToBase64String(frame)}";

                _lastFrame = frame;
                _encodedFrame = encodedFrame;
            }

            return encodedFrame;
        }

        private byte[] _lastFrame;
        private string _encodedFrame;
        private RenderServer _context;
    }
}