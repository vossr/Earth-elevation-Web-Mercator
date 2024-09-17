from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
from math import floor
from PIL import Image
import rasterio
import os

def add_text_to_image(image_path, text):
    image = Image.open(image_path)
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("arial.ttf", 20)
    text_x = 0
    text_y = 0
    draw.text((text_x, text_y), text, font=font, fill=(255, 255, 255))
    image.save(image_path)

def save_heightmap_image(image, file_name):
    fig, ax = plt.subplots()
    ax.set_axis_off()
    cax = ax.imshow(image, cmap='magma')
    cbar = fig.colorbar(cax, ax=ax, label='Height (meters from EGM96)')

    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(cbar.ax.get_yticklabels(), color='white')
    cbar.ax.yaxis.label.set_color('white')
    
    cbar.ax.yaxis.set_tick_params(color='white')
    cbar.ax.yaxis.label.set_color('white')
    plt.gca().set_facecolor('black')
    fig.patch.set_facecolor('black')
    plt.savefig(file_name, bbox_inches='tight', pad_inches=0)
    plt.close(fig)

def lat_lon_to_awd_filename(lat, lon):
    ns = 'N' if lat >= 0 else 'S'
    ew = 'E' if lon >= 0 else 'W'
    lat_index = abs(floor(lat))
    lon_index = abs(floor(lon))
    lat_index_str = f"{lat_index:03}"
    lon_index_str = f"{lon_index:03}"
    filename = f"ALPSMLC30_{ns}{lat_index_str}{ew}{lon_index_str}_DSM.tif"
    return filename

def gen_tile_aw3d30(title, lat, lon):
    img = rasterio.open("AW3D30_global/" + lat_lon_to_awd_filename(lat, lon))
    os.makedirs('img', exist_ok=True)
    titlefn = title.replace(' ', '_').replace(',', '')
    filename = "img/" + titlefn + '.png'
    save_heightmap_image(img.read(1), filename)
    add_text_to_image(filename, title)

if __name__ == "__main__":
    gen_tile_aw3d30("Mount Everest, China-Nepal", 27.9881, 86.9259)
    gen_tile_aw3d30("Aconcagua, Argentina", -32.653099, -70.012088)
    gen_tile_aw3d30("Denali, Alaska, USA", 63.0695, -151.0074)
    gen_tile_aw3d30("Mount Kilimanjaro, Tanzania", -3.0433, 37.2112)
    gen_tile_aw3d30("Halti, Norway-Finland", 69.1846, 21.1708)

    gen_tile_aw3d30("Dead Sea, Jordan-Israel", 31.5590, 35.4732)
    gen_tile_aw3d30("Turpan Depression, Xinjiang, China", 42.40, 89.14)
    gen_tile_aw3d30("Caspian Depression, Kazakhstan", 47.32, 49.00)
    gen_tile_aw3d30("Qattara Depression, Egypt", 29.32, 27.07)
    gen_tile_aw3d30("Death Valley, California, USA", 36.27, -116.52)

    gen_tile_aw3d30("New York, USA", 40.71861435402379, -74.00357277867118)
    gen_tile_aw3d30("Salton Sea, California, USA", 33.3, -115.8)
