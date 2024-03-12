import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Button,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImageObject, IProps, RenderImageProps } from './types';
import ImagePreview from './ImagePreview';
import SwipeContainer from './SwipeContainer';
//import RNFetchBlob from 'rn-fetch-blob';
import BlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';

const { height: deviceHeight, width: deviceWidth } = Dimensions.get('window');

const defaultProps = {
  hideThumbs: false,
  resizeMode: 'contain',
  thumbColor: '#d9b44a',
  thumbResizeMode: 'cover',
  thumbSize: 48,
};

const ImageGallery = (props: IProps & typeof defaultProps) => {
  const {
    close,
    hideThumbs,
    images,
    initialIndex,
    isOpen,
    renderCustomImage,
    renderCustomThumb,
    renderFooterComponent,
    renderHeaderComponent,
    resizeMode,
    thumbColor,
    thumbResizeMode,
    thumbSize,
    disableSwipe,
    onIndexChange
  } = props;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const topRef = useRef<FlatList>(null);
  const bottomRef = useRef<FlatList>(null);

  const keyExtractorThumb = (item: ImageObject, index: number) =>
    item && item.id ? item.id.toString() : index.toString();
  const keyExtractorImage = (item: ImageObject, index: number) =>
    item && item.id ? item.id.toString() : index.toString();

  const scrollToIndex = (i: number) => {
    setActiveIndex(i);
    onIndexChange(i)
    if (topRef?.current) {
      topRef.current.scrollToIndex({
        animated: true,
        index: i,
      });
    }
    if (bottomRef?.current) {
      if (i * (thumbSize + 10) - thumbSize / 2 > deviceWidth / 2) {
        bottomRef?.current?.scrollToIndex({
          animated: true,
          index: i,
        });
      } else {
        bottomRef?.current?.scrollToIndex({
          animated: true,
          index: 0,
        });
      }
    }
  };

  const renderItem = ({ item, index }: RenderImageProps) => {
    return (
      <ImagePreview
        index={index}
        isSelected={activeIndex === index}
        item={item}
        resizeMode={resizeMode}
        renderCustomImage={renderCustomImage}
      />
    );
  };

  const renderThumb = ({ item, index }: RenderImageProps) => {
    return (
      <TouchableOpacity
        onPress={() => scrollToIndex(index)}
        activeOpacity={0.8}
      >
        {renderCustomThumb ? (
          renderCustomThumb(item, index, activeIndex === index)
        ) : (
          <Image
            resizeMode={thumbResizeMode}
            style={
              activeIndex === index
                ? [
                  styles.thumb,
                  styles.activeThumb,
                  { borderColor: thumbColor },
                  { width: thumbSize, height: thumbSize },
                ]
                : [styles.thumb, { width: thumbSize, height: thumbSize }]
            }
            source={{ uri: item.thumbUrl ? item.thumbUrl : item.url }}
          />
        )}

      </TouchableOpacity>
    );
  };

  const onMomentumEnd = (e: any) => {
    const { x } = e.nativeEvent.contentOffset;
    scrollToIndex(Math.round(x / deviceWidth));
  };

  useEffect(() => {
    if (isOpen && initialIndex) {
      setActiveIndex(initialIndex);
    } else if (!isOpen) {
      setActiveIndex(0);
    }
  }, [isOpen, initialIndex]);

  const getImageLayout = useCallback((_, index) => {
    return {
      index,
      length: deviceWidth,
      offset: deviceWidth * index,
    };
  }, []);

  const getThumbLayout = useCallback(
    (_, index) => {
      return {
        index,
        length: thumbSize,
        offset: thumbSize * index,
      };
    },
    [thumbSize]
  );

  const getDownloadDirectory = () => {
    if (Platform.OS === 'android') {
      //return RNFetchBlob.fs.dirs.DownloadDir;
      return RNFS.DownloadDirectoryPath;
    } else {
      //return RNFetchBlob.fs.dirs.DocumentDir;
      return RNFS.DocumentDirectoryPath;
    }
  };

  const DownloadImage = async () => {
    try {
      const image = images[activeIndex];
      const url = image.url;
 
     /* const response = await RNFetchBlob.config({
        fileCache: true,
      }).fetch('GET', url);
      */

      BlobUtil

      console.log("url: ",url)
     const response = await BlobUtil.config({
      fileCache: true,
    }).fetch('GET', url);

    console.log('Response:', response);

      const imagePath = response.path();

      const downloadDir = getDownloadDirectory();

      const filenameRegex = /fileName=([^&]*)/;
      const filenameMatch = url.match(filenameRegex);
      const filename = filenameMatch ? filenameMatch[1] : null;
      console.log('Filename:', filename);
      if(filename!==null || filename!=="") {
      const destPath = `${downloadDir}/${filename}`;

      //await RNFetchBlob.fs.mv(imagePath, destPath);
      console.log("from path: ", imagePath)
      console.log('Moving file to:', destPath);
      await BlobUtil.fs.cp(imagePath, destPath)
      .then(() => {
        console.log('File moved');
      })
      .catch((error: any) => {
        console.error('Error moving file:', error);
      });
      }

    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };


  return (
    <Modal animationType={isOpen ? 'slide' : 'fade'} visible={isOpen}>
      <View style={styles.container}>


        <TouchableOpacity
          style={{ position: 'absolute', top: 20, right: 20, zIndex: 999 }}
          onPress={close}
        >
          <Button title="Close" onPress={close} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ position: 'absolute', top: 20, right: 90, zIndex: 999 }}
          onPress={DownloadImage}
        >
          <Button title="Download" onPress={DownloadImage} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ position: 'absolute', top: 20, left: 90, zIndex: 999 }}
          onPress={() => scrollToIndex(activeIndex + 1)}
        >
          <Button title="Next" onPress={() => scrollToIndex(activeIndex + 1)} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ position: 'absolute', top: 20, left: 20, zIndex: 999 }}
          onPress={() => scrollToIndex(activeIndex - 1)}
        >
          <Button title="Prev" onPress={() => scrollToIndex(activeIndex - 1)} />
        </TouchableOpacity>




        <SwipeContainer
          disableSwipe={disableSwipe}
          setIsDragging={setIsDragging}
          close={close}
        >
          <FlatList
            initialScrollIndex={initialIndex}
            getItemLayout={getImageLayout}
            data={images}
            horizontal
            keyExtractor={keyExtractorImage}
            onMomentumScrollEnd={onMomentumEnd}
            pagingEnabled
            ref={topRef}
            renderItem={renderItem}
            scrollEnabled={!isDragging}
            showsHorizontalScrollIndicator={false}
          />
        </SwipeContainer>
        {hideThumbs ? null : (
          <FlatList
            initialScrollIndex={initialIndex}
            getItemLayout={getThumbLayout}
            contentContainerStyle={styles.thumbnailListContainer}
            data={props.images}
            horizontal
            keyExtractor={keyExtractorThumb}
            pagingEnabled
            ref={bottomRef}
            renderItem={renderThumb}
            showsHorizontalScrollIndicator={false}
            style={[styles.bottomFlatlist, { bottom: thumbSize }]}
          />

        )}

        {renderHeaderComponent ? (
          <View style={styles.header}>
            {renderHeaderComponent(images[activeIndex], activeIndex)}
          </View>
        ) : null}
        {renderFooterComponent ? (
          <View style={styles.footer}>
            {renderFooterComponent(images[activeIndex], activeIndex)}
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'black',
    flex: 1,
    height: deviceHeight,
    justifyContent: 'center',
    width: deviceWidth,
  },

  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  footer: {
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
  activeThumb: {
    borderWidth: 3,
  },
  thumb: {
    borderRadius: 12,
    marginRight: 10,
  },
  thumbnailListContainer: {
    paddingHorizontal: 10,
  },
  bottomFlatlist: {
    position: 'absolute',
  },
});

ImageGallery.defaultProps = defaultProps;

export default ImageGallery;
