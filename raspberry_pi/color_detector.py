import cv2
import numpy as np
from sklearn.cluster import KMeans
import time
import requests
from datetime import datetime

# Define basic colors in HSV space with broader ranges
COLORS = {
    'red': ([0, 50, 50], [10, 255, 255]),       # Red has two ranges in HSV
    'red2': ([160, 50, 50], [180, 255, 255]),   # Second red range
    'blue': ([100, 50, 50], [130, 255, 255]),
    'green': ([35, 50, 50], [85, 255, 255]),
    'yellow': ([20, 50, 50], [35, 255, 255]),
    'orange': ([10, 50, 50], [20, 255, 255]),
    'purple': ([130, 50, 50], [160, 255, 255]),
    'white': ([0, 0, 180], [180, 30, 255]),
    'black': ([0, 0, 0], [180, 255, 50])
}

def get_color_name(hsv_values):
    """Get color name based on HSV ranges"""
    h, s, v = hsv_values[0], hsv_values[1], hsv_values[2]
    
    for color_name, (lower, upper) in COLORS.items():
        if (lower[0] <= h <= upper[0] and
            lower[1] <= s <= upper[1] and
            lower[2] <= v <= upper[2]):
            if color_name == 'red2':
                return 'red'
            return color_name
            
    return 'unknown'

def get_dominant_color(image):
    """Get the dominant color in HSV space using K-means clustering"""
    # Convert to HSV
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Reshape the image
    pixels = hsv_image.reshape(-1, 3)
    
    # Use K-means to find the dominant color cluster
    kmeans = KMeans(n_clusters=1, n_init=10)
    kmeans.fit(pixels)
    
    # Get the dominant color
    dominant_color = kmeans.cluster_centers_[0].astype(int)
    
    # Ensure H value is in range 0-180 (OpenCV HSV format)
    dominant_color[0] = dominant_color[0] % 180
    
    return dominant_color

def init_camera():
    """Initialize camera, trying Pi Camera first, then USB"""
    try:
        # Try to initialize Pi Camera first
        from picamera2 import Picamera2
        print("Initializing Pi Camera...")
        camera = Picamera2()
        camera.start()
        return camera, 'picamera'
    except (ImportError, Exception) as e:
        print("Pi Camera not available, trying USB camera...")
        try:
            # Try USB camera
            camera = cv2.VideoCapture(0)
            if not camera.isOpened():
                raise Exception("Failed to open USB camera")
            return camera, 'usb'
        except Exception as e:
            raise Exception("No camera available") from e

def main():
    print("Initializing camera...")
    camera, cam_type = init_camera()
    
    # Allow camera to warm up
    time.sleep(2)
    
    # Initialize last API call time
    last_api_call = time.time()
    
    try:
        while True:
            # Get frame from camera
            if cam_type == 'picamera':
                frame = camera.capture_array()
            else:
                ret, frame = camera.read()
                if not ret:
                    print("Failed to grab frame")
                    break
                
            # Get frame dimensions
            height, width = frame.shape[:2]
            
            # Define the center region (100x100 pixels)
            center_size = 100
            x1 = width//2 - center_size//2
            y1 = height//2 - center_size//2
            x2 = x1 + center_size
            y2 = y1 + center_size
            
            # Extract center region
            center_region = frame[y1:y2, x1:x2]
            
            # Get dominant color
            dominant_color = get_dominant_color(center_region)
            color_name = get_color_name(dominant_color)
            
            # Draw rectangle and color name
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, color_name, (x1, y1-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            
            # Display color values
            print(f"\rDetected color: {color_name} (HSV: {dominant_color})", end="")
            
            # Send color detection to backend every 3 seconds
            current_time = time.time()
            if current_time - last_api_call >= 3:
                try:
                    requests.post('http://localhost:3000/api/detections', 
                        json={
                            'color': color_name,
                            'hsv_values': dominant_color.tolist()
                        },
                        timeout=1
                    )
                    last_api_call = current_time
                except requests.exceptions.RequestException:
                    pass  # Silently handle connection errors
            
            # Show frame
            cv2.imshow('Color Predictor', frame)
            
            # Break loop on 'q' press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        print("\nStopping the program...")
    finally:
        # Release resources
        if cam_type == 'usb':
            camera.release()
        cv2.destroyAllWindows()

if __name__ == '__main__':
    main()