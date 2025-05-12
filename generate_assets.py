import os
import shutil
import webbrowser
import time
from pathlib import Path

def create_directories():
    """Create necessary directories for assets."""
    directories = ['sprites', 'sounds']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

def open_generators():
    """Open the sprite and sound generators in the browser."""
    webbrowser.open('http://localhost:8000/sprite_generator.html')
    time.sleep(2)  # Wait for first page to load
    webbrowser.open('http://localhost:8000/sound_generator.html')

def main():
    # Create directories
    create_directories()
    
    # Open generators in browser
    open_generators()
    
    print("Please follow these steps:")
    print("1. In the Sprite Generator:")
    print("   - Click each button to generate all sprites")
    print("   - Move the downloaded sprites to the 'sprites' folder")
    print("\n2. In the Sound Generator:")
    print("   - Click each button to generate all sounds")
    print("   - Move the downloaded sounds to the 'sounds' folder")
    print("\nPress Enter when you're done...")
    input()

if __name__ == "__main__":
    main() 