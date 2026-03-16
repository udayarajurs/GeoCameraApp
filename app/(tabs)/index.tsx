import { Camera, CameraType, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';


export default function TabTwoScreen() {
 
  const cameraRef = useRef<Camera | null>(null);
  const viewShotRef = useRef<ViewShot | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  
  
useEffect(() => {
  (async () => {

    // Camera permission
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraStatus === 'granted');

    // Location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    const granted = locationStatus === 'granted';
    setHasLocationPermission(granted);

    // Get location immediately
    if (granted) {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const address = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          address: {
            formattedAddress: `${address[0]?.street || ''} ${address[0]?.city || ''} ${address[0]?.region || ''}`,
          },
        });

      } catch (error) {
        console.log("Location error:", error);
      }
    }

    // Date & Time
    const now = new Date();
    setDate(now.toLocaleDateString());
    setTime(now.toLocaleTimeString());

  })();
}, []);

  



  // Take photo with camera
  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    setPhotoUri(photo.uri);

  };

  // Save photo with overlay
  const savePhotoWithOverlay = async () => {
    if (!viewShotRef.current) return;

    try {
      const uri = await viewShotRef.current.capture();
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission required to save photo');
        return;
      }

      await MediaLibrary.createAssetAsync(uri);
      alert('Image saved with overlay!');
    } catch (error) {
      console.log('Error saving photo:', error);
      alert('Failed to save photo');
    }
  };

  if (hasCameraPermission === null) return <Text>Requesting camera permission...</Text>;
  if (hasCameraPermission === false) return <Text>No access to camera</Text>;


  return (
    <View style={{ flex: 1 }}>
      {photoUri ? (

        <ViewShot ref={viewShotRef} style={{ flex: 1 }} options={{ format: 'jpg', quality: 1 }}>
          <Image source={{ uri: photoUri }} style={{ flex: 1 }} />
          <View style={styles.overlay}>
            <Text style={styles.text}>{location ? location.address.formattedAddress : 'Location N/A'}</Text>
            <Text style={styles.text}>{`Date: ${date}   Time: ${time}`}</Text>
            <Text style={styles.text}>
              {location ? `Latitude: ${location.latitude}  Longitude: ${location.longitude}` : ''}
            </Text>
          </View>
        </ViewShot>
      ) : (
     
         
//          <CameraView  ref={cameraRef} style={{flex: 1}} facing={facing}  mode="picture"/>

          
          <View style={{ flex: 1 }}>
    <CameraView  ref={cameraRef} style={{flex: 1}} facing={facing}  mode="picture"/>
  <View style={styles.overlay}>
    <Text style={styles.text}>
      {location ? location.address.formattedAddress : 'Location N/A'}
    </Text>

    <Text style={styles.text}>{`Date: ${date}`}</Text>

    <Text style={styles.text}>{`Time: ${time}`}</Text>

    <Text style={styles.text}>
      {location
        ? `Latitude: ${location.latitude}  Longitude: ${location.longitude}`
        : ''}
    </Text>
  </View>
</View>

  
          

      )}

      <View style={styles.buttons}>
        {!photoUri ? (
          <Button title="Take Photo" onPress={takePhoto} />
        ) : (
          <>
            <Button title="Save Photo" onPress={savePhotoWithOverlay} />
            <Button title="Retake" onPress={() => setPhotoUri(null)} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
});


 