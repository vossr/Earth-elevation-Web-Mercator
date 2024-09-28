from pygeodesy.geoids import GeoidKarney
import multiprocessing
import numpy as np
import os

slow_geoid = GeoidKarney("./geoid/egm96-5.pgm")

def worker_function(lat_range, lon_range):
    partial_heightmap = []
    maxvals = len(lat_range)
    for i, lat in enumerate(lat_range):
        row = [float(slow_geoid.height(lat, lon)) for lon in lon_range]
        partial_heightmap.append(row)
        print(format(i / maxvals * 100, ".3f"))
    return partial_heightmap

def precompute_fast_geoid():
    lat_step = 0.1
    lon_step = 0.1
    latitudes = np.arange(-90, 90 + lat_step, lat_step)
    longitudes = np.arange(-180, 180, lon_step)

    cpu_count = multiprocessing.cpu_count()
    print('cpu_count', cpu_count)
    lat_chunks = np.array_split(latitudes, cpu_count)

    with multiprocessing.Pool(processes=cpu_count) as pool:
        results = pool.starmap(worker_function, [(chunk, longitudes) for chunk in lat_chunks])

    heightmap = np.vstack(results)
    os.makedirs('geoid', exist_ok=True)
    np.save('geoid/geoid_heightmap.npy', heightmap)
    np.save('geoid/geoid_lat.npy', latitudes)
    np.save('geoid/geoid_lon.npy', longitudes)

if __name__ == "__main__":
    precompute_fast_geoid()
