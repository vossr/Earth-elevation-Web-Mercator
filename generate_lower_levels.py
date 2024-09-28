from PIL import Image
import numpy as np
import multiprocessing
import cv2
import os
import encoding
import generate_webmercator

filetype = '.png'
# filetype = '.webp'
tile_size = 512

#gen new tile if at least 1/4 sub tiles exists
def combine_tiles(zoom, x, y):
    tile_directory = 'generated_tiles'
    new_x = x // 2
    new_y = y // 2
    
    tile_exists = False 
    combined_image = np.zeros((tile_size * 2, tile_size * 2), dtype=np.float32)
    for dx in range(2):
        for dy in range(2):
            path = f"{tile_directory}/{zoom}/{2*new_x+dx}/{2*new_y+dy}{filetype}"
            try:
                tile = Image.open(path)
                tile = np.array(tile)
                tile = tile.astype(np.uint8)
                tile = encoding.decode_mapbox_terrain_v1_elevation(tile)
                tile_exists = True
            except FileNotFoundError:
                tile = generate_webmercator.gen_tile_heightmap_geoid_only(zoom, 2*new_x+dx, 2*new_y+dy, tile_size)
            x_offset = dx * tile_size
            y_offset = dy * tile_size
            combined_image[y_offset:y_offset+tile_size, x_offset:x_offset+tile_size] = tile
    if tile_exists:
        final_image = combined_image.reshape(tile_size, 2, tile_size, 2)
        final_image = final_image.mean(axis=(1, 3))
        final_image = encoding.encode_mapbox_terrain_v1_elevation(final_image)

        new_path = f"{tile_directory}/{zoom-1}/{new_x}/{new_y}{filetype}"
        os.makedirs(os.path.dirname(new_path), exist_ok=True)
        cv2.imwrite(new_path, final_image)
        # final_image.save(new_path)

def thread_generate_level(z, x, start_y, end_y):
    for y in range(start_y, end_y):
        # if does_height_data_exist_at(z, x, y):
        print('z', zoom, 'x', x)
        combine_tiles(z, x, y)

if __name__ == "__main__":
    min = 6
    for zoom in range(min, 0, -1):
        max_tile_index = 2 ** zoom - 1
        max_range = max_tile_index + 1
        for x in range(0, max_range, 2):

            # for y in range(0, max_range, 2):
            #     combine_tiles(zoom, x, y)
            
            num_processes = 8
            processes = []
            chunk_size = max_range // num_processes
            for i in range(num_processes):
                start_y = i * chunk_size
                end_y = start_y + chunk_size if i < num_processes - 1 else max_range
                process = multiprocessing.Process(target=thread_generate_level, args=(zoom, x, start_y, end_y))
                processes.append(process)
                process.start()

            for process in processes:
                process.join()
