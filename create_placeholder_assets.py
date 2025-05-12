from PIL import Image, ImageDraw
import os
import wave
import struct

def create_placeholder_sprite(name, width, height, color):
    """Create a simple colored rectangle as a placeholder sprite."""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, width-1, height-1], fill=color)
    img.save(f'sprites/{name}.png')

def create_placeholder_sound(name, duration=1.0):
    """Create a simple sine wave as a placeholder sound."""
    sampleRate = 44100
    numSamples = int(duration * sampleRate)
    
    with wave.open(f'sounds/{name}.wav', 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sampleRate)
        
        for i in range(numSamples):
            value = int(32767.0 * (i / numSamples))
            data = struct.pack('<h', value)
            wav_file.writeframes(data)

def main():
    # Create directories if they don't exist
    os.makedirs('sprites', exist_ok=True)
    os.makedirs('sounds', exist_ok=True)
    
    # Create placeholder sprites
    create_placeholder_sprite('player', 64, 64, (76, 175, 80, 255))  # Green
    create_placeholder_sprite('raptor', 64, 64, (255, 68, 68, 255))  # Red
    create_placeholder_sprite('triceratops', 64, 64, (68, 255, 68, 255))  # Green
    create_placeholder_sprite('trex', 64, 64, (68, 68, 255, 255))  # Blue
    create_placeholder_sprite('bullet', 32, 32, (255, 215, 0, 255))  # Gold
    create_placeholder_sprite('powerup', 32, 32, (255, 0, 0, 255))  # Red
    
    # Create placeholder sounds
    create_placeholder_sound('shoot', 0.1)
    create_placeholder_sound('hit', 0.2)
    create_placeholder_sound('powerup', 0.3)
    create_placeholder_sound('gameover', 1.0)
    create_placeholder_sound('background', 5.0)

if __name__ == "__main__":
    main() 