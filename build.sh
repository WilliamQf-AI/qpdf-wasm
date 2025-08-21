#!/bin/bash
set -e

mkdir -p local
install_prefix="$(pwd)/local"

# LIBJPEG
pushd libjpeg-turbo/
git apply ../libjpeg-turbo.patch || true
mkdir -p build
cd build
emmake cmake \
       -DCMAKE_INSTALL_PREFIX="$install_prefix" \
       -DCMAKE_C_FLAGS='-Os -fdata-sections -ffunction-sections' \
       -DENABLE_STATIC=1 \
       -DENABLE_SHARED=0 \
       -DWITH_JAVA=0 \
       -DWITH_TURBOJPEG=0 \
       -DWITH_FUZZ=0 \
       ..
emmake make -j8 jpeg-static
emmake make -j8 install
popd

# ZLIB
pushd zlib
emconfigure ./configure --prefix "$install_prefix"
emmake make -j8 libz.a
emmake make -j8 install
popd

# QPDF
pushd qpdf
git apply ../qpdf.patch || true
emmake cmake -S . -B build \
       -DCMAKE_BUILD_TYPE=MinSizeRel \
       -DCMAKE_PREFIX_PATH="$install_prefix" \
       -DCMAKE_INSTALL_PREFIX="$install_prefix" \
       -DBUILD_SHARED_LIBS=OFF \
       -DINSTALL_EXAMPLES=OFF \
       -DCMAKE_CXX_FLAGS='-Os -fdata-sections -ffunction-sections -I../zlib -L../zlib' \
       -DREQUIRE_CRYPTO_NATIVE=ON \
       -DUSE_IMPLICIT_CRYPTO=OFF
emmake cmake --build build --parallel --target libqpdf
emmake make -C build -j8 install
popd

# WASM
emcc -o qpdf.js \
    $(PKG_CONFIG_PATH="$install_prefix/lib/pkgconfig" pkg-config --env-only --static --cflags --libs libqpdf) \
    -Wl,--gc-sections \
    --no-entry \
    -sEXPORTED_RUNTIME_METHODS=HEAP8,UTF8ToString \
    -sEXPORTED_FUNCTIONS=_qpdf_init,_qpdf_cleanup,_qpdf_has_error,_qpdf_get_error,_qpdf_get_error_full_text,_qpdf_get_error_code,_qpdf_get_error_filename,_qpdf_get_error_file_position,_qpdf_get_error_message_detail,_qpdf_check_pdf,_qpdf_read_memory,_qpdf_init_write_memory,_qpdf_write,_qpdf_get_buffer_length,_qpdf_get_buffer,_qpdf_set_preserve_encryption,_malloc,_free \
    -sMAXIMUM_MEMORY=67108864 \
    -sALLOW_MEMORY_GROWTH \
    -sENVIRONMENT=node \
    -sFILESYSTEM=0 \
    -sEXPORT_ES6 \
    -sMODULARIZE 

# TYPESCRIPT
npx tsc --build ./tsconfig.json

# OTHER FILES
cp --reflink=auto ./qpdf.js ./qpdf.wasm dist/
