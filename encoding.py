import numpy as np

#rgb to float meters
def decode_mapbox_terrain_v1_elevation(data):
    R = data[:,:,0].astype(np.int32)
    G = data[:,:,1].astype(np.int32)
    B = data[:,:,2].astype(np.int32)

    elevations = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
    return elevations

#float meters to rgb
def encode_mapbox_terrain_v1_elevation(data):
    data = data.astype(np.float64)
    data -= -10000
    data /= 0.1

    data = np.around(data)
    rows, cols = data.shape
    rgb = np.zeros((rows, cols, 3), dtype=np.uint8)
    rgb[..., 0] = ((data / 256) - (data // 256)) * 256
    rgb[..., 1] = (((data // 256) / 256) - ((data // 256) // 256)) * 256
    rgb[..., 2] = ((((data // 256) // 256) / 256) - (((data // 256) // 256) // 256)) * 256
    return rgb
