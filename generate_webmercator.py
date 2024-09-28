from dataclasses import dataclass
import multiprocessing
from PIL import Image
import numpy as np
import time
import math
import cv2
import os
import sample_elevation
import sample_geoid_fast
import encoding

out_tilesize = 256
# out_tilesize = 512

@dataclass
class LatLon:
    lat: float
    lon: float

def tile_to_lat_lon(z, x, y):
    n = 2 ** z
    lon_deg = (x / n) * 360 - 180
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * y / n)))

    lat_deg = (lat_rad * 180) / math.pi
    return LatLon(lat_deg, lon_deg)

def get_tile_corners(z, x, y):
    upper_left = tile_to_lat_lon(z, x, y)
    upper_right = tile_to_lat_lon(z, x + 1, y)
    lower_left = tile_to_lat_lon(z, x, y + 1)
    lower_right = tile_to_lat_lon(z, x + 1, y + 1)
    return upper_left, upper_right, lower_left, lower_right

def does_height_data_exist_at(z, x, y):
    upper_left, upper_right, lower_left, lower_right = get_tile_corners(z, x, y)
    lats = [upper_left.lat, upper_right.lat, lower_left.lat, lower_right.lat]
    lons = [upper_left.lon, upper_right.lon, lower_left.lon, lower_right.lon]
    pixel_elevations, allnone = sample_elevation.sample_elevation_aw3d30_array(lats, lons)
    if allnone:
        return False
    return True

def encode_elevation_to_rgb(elevation_array):
    data_min_value = 10000 
    data = (elevation_array + data_min_value) / 0.1
    data = data.astype(np.uint32)
    
    rgb = np.zeros((*data.shape, 3), dtype=np.uint8)
    rgb[..., 0] = (data // (256*256)) % 256
    rgb[..., 1] = (data // 256) % 256
    rgb[..., 2] = data % 256
    return rgb

def gen_tile_heightmap(z, x, y):
    upper_left, upper_right, lower_left, lower_right = get_tile_corners(z, x, y)
    image = np.zeros((out_tilesize, out_tilesize))

    # precompute lerps
    row_lats = np.linspace(upper_left.lat, lower_left.lat, out_tilesize)
    col_lons = np.linspace(upper_left.lon, upper_right.lon, out_tilesize)
    lat_interp = np.linspace(upper_right.lat, lower_right.lat, out_tilesize)
    lon_interp = np.linspace(lower_left.lon, lower_right.lon, out_tilesize)

    pixel_centers_lat = []
    pixel_centers_lon = []
    for yi in range(out_tilesize):
        top_lat = row_lats[yi]
        bottom_lat = lat_interp[yi]
        for xi in range(out_tilesize):
            left_lon = col_lons[xi]
            right_lon = lon_interp[xi]

            pixel_center_lat = top_lat + (bottom_lat - top_lat) * (xi / (out_tilesize - 1))
            pixel_center_lon = left_lon + (right_lon - left_lon) * (xi / (out_tilesize - 1))
            pixel_centers_lat.append(pixel_center_lat)
            pixel_centers_lon.append(pixel_center_lon)

    pixel_elevations, allnone = sample_elevation.sample_elevation_aw3d30_array(pixel_centers_lat, pixel_centers_lon)
    if allnone:
        return
    image = image.astype(float)

    #add egm96 elevation offset
    pixel_elevations += np.array([sample_geoid_fast.get_geoid_height(lat, lon) for lat, lon in zip(pixel_centers_lat, pixel_centers_lon)])

    image = np.reshape(pixel_elevations, (out_tilesize, out_tilesize))


    # Page 7 https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/data/aw3d30v3.2_product_e_e1.2.pdf
    # Value “-9999” is stored in void pixels
    # Value “0m” is stored in sea pixels
    image[image <= -9999] = 0.0

    image = encoding.encode_mapbox_terrain_v1_elevation(image)

    out_filename = f"generated_tiles/{z}/{x}/{y}.png"
    os.makedirs(os.path.dirname(out_filename), exist_ok=True)
    cv2.imwrite(out_filename, image)

    # out_filename = f"generated_tiles/{z}/{x}/{y}.webp"
    # os.makedirs(os.path.dirname(out_filename), exist_ok=True)
    # image[..., [0, 2]] = image[..., [2, 0]]  # Swap R (index 0) and B (index 2)
    # image = Image.fromarray(image)
    # image.save(out_filename, format='WEBP', quality=100, method=6)
    # img.save(out_filename, format='WEBP', quality=70, method=0)

interpolator = sample_geoid_fast.load_fast_geoid()
sample_geoid_fast.set_interpolator(interpolator)#set if calling only gen_tile_heightmap
start_time = time.time()
def thread_generate(n, z, x, start_y, end_y):
    sample_geoid_fast.set_interpolator(interpolator)
    for y in range(start_y, end_y):
        # if does_height_data_exist_at(z, x, y):
        gen_tile_heightmap(z, x, y)

def generate_all_tiles_of_level(z):
    n = 2 ** z # number of tiles width or height at depth z

    full_count = n * n
    tiles_processed = 0
    for x in range(n):
        elapsed_time = time.time() - start_time
        print(f"x = {x}  {(tiles_processed / full_count * 100):.2f}%  runtime: {elapsed_time:.2f}s")
        tiles_processed += n

        num_processes = 32
        processes = []
        chunk_size = n // num_processes
        for i in range(num_processes):
            start_y = i * chunk_size
            end_y = start_y + chunk_size if i < num_processes - 1 else n
            process = multiprocessing.Process(target=thread_generate, args=(n, z, x, start_y, end_y))
            processes.append(process)
            process.start()

        for process in processes:
            process.join()

if __name__ == "__main__":
    # generate_all_tiles_of_level(5)
    # generate_all_tiles_of_level(6)
    # generate_all_tiles_of_level(7)
    generate_all_tiles_of_level(8)
    # generate_all_tiles_of_level(10)
    # generate_all_tiles_of_level(10)
