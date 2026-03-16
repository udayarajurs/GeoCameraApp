import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
            formattedAddress: `${address[0]?.formattedAddress || ''}`,
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
       
         Alert.alert(
    "Permission Required",
    "Please allow photo access in settings to save the image.",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Open Settings",
        onPress: () => Linking.openSettings()
      }
    ]
  );
        return;
      }

      await MediaLibrary.createAssetAsync(uri);




      alert('Image saved!');
setPhotoUri(null)

    } catch (error) {
      console.log('Error saving photo:', error);
      alert('Failed to save photo');
    }
  };

if (hasCameraPermission === false || hasLocationPermission === false) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

      <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16 }}>
        Camera & Location permissions are required
      </Text>

      <TouchableOpacity
       onPress={async () => {

          const camera = await Camera.requestCameraPermissionsAsync();
          const location = await Location.requestForegroundPermissionsAsync();

          if (camera.status === 'granted' && location.status === 'granted') {
            setHasCameraPermission(true);
            setHasLocationPermission(true);
          } else {
            alert("Please enable Camera and Location permission in Settings");
            Linking.openSettings();
          }

        }}
        style={{
          marginTop: 20,
          padding: 12,
          backgroundColor: 'blue',
          borderRadius: 6
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Grant Permissions
        </Text>

      </TouchableOpacity>

    </View>
  );
}

  
if (hasCameraPermission === null || hasLocationPermission === null) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="blue"  />
    </View>
  );
}
 
  const isLoading = !location || !date || !time;

  return (
    <View style={{ flex: 1 }}>
      {photoUri ? (

        <ViewShot ref={viewShotRef} style={{ flex: 1 }} options={{ format: 'jpg', quality: 1 }}>
          <Image source={{ uri: photoUri }} style={{ flex: 1 }} />
          <View style={styles.overlay}>
     
        
          <View>
             <Text style={{color: 'black', fontWeight: 'bold'}}>{location ? location?.address?.formattedAddress : 'loading...'}</Text>
         </View>


          <View style={{paddingHorizontal: 5 , flexDirection: 'row', justifyContent: 'space-between',marginTop: 10}}>
             <Text style={{color: 'black' , fontWeight: 'bold'}}>{date ? `Date: ${date}` : 'loading...'}</Text>
              <Text style={{color: 'black', fontWeight: 'bold'}}>{location ? `latitude: ${location?.latitude}` : 'loading...'}</Text>
          </View>

          <View style={{paddingHorizontal: 5 ,flexDirection: 'row', justifyContent: 'space-between',marginTop: 5}}>
             <Text style={{color: 'black', fontWeight: 'bold'}}>{time ? `Time: ${time}` : 'loading...'}</Text>
            <Text style={{color: 'black', fontWeight: 'bold'}}>{location ? `longitude: ${location?.longitude}` : 'loading...'}</Text>
          </View>
         
  
  </View>
        </ViewShot>
      ) : (
     


          
          <View style={{ flex: 1 }}>
    <CameraView  ref={cameraRef} style={{flex: 1}} facing={facing}  mode="picture"/>
  <View style={{position: 'absolute',
    bottom: 125,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(248, 246, 246, 0.78)',
    padding: 10,
    borderRadius: 8,}}>
     
        
          <View>
             <Text style={{color: 'black', fontWeight: 'bold'}}>{location ? location?.address?.formattedAddress : 'loading...'}</Text>
         </View>


          <View style={{paddingHorizontal: 5 , flexDirection: 'row', justifyContent: 'space-between',marginTop: 10}}>
             <Text style={{color: 'black' , fontWeight: 'bold'}}>{date ? `Date: ${date}` : 'loading...'}</Text>
              <Text style={{color: 'black', fontWeight: 'bold'}}>{location ? `latitude: ${location?.latitude}` : 'loading...'}</Text>
          </View>

          <View style={{paddingHorizontal: 5 ,flexDirection: 'row', justifyContent: 'space-between',marginTop: 5}}>
             <Text style={{color: 'black', fontWeight: 'bold'}}>{time ? `Time: ${time}` : 'loading...'}</Text>
            <Text style={{color: 'black', fontWeight: 'bold'}}>{location ? `longitude: ${location?.longitude}` : 'loading...'}</Text>
          </View>
         
  
  </View>
</View>

  
          

      )}

      <View style={styles.buttons}>
        {!photoUri ? (
          


          
<View>
             {isLoading ? (
                <View style={{ width:55, height:55, justifyContent:'center', alignItems:'center' }}>
                  <ActivityIndicator size="large" color="white" />
                </View>
      ) : (
      <View style={{ borderWidth: 2, borderColor: 'white', borderRadius: 50, padding: 3 }}>
                <TouchableOpacity onPress={takePhoto} disabled={!location}>
                  <View style={{ width:55, height:55, borderRadius:30, backgroundColor:'white' }} />
        </TouchableOpacity>
            </View>
              )}

      </View>
        ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', width: '100%', bottom: 1, paddingHorizontal: 20 }}>
              
                <TouchableOpacity hitSlop={{top:100 , bottom: 100 , left: 100 , right: 100}} onPress={() => setPhotoUri(null)} >
                <Ionicons
                  name="refresh"
                  size={30}
                  color="white"
              
                />

               
              </TouchableOpacity>

                <TouchableOpacity hitSlop={{top:100 , bottom: 100 , left: 100 , right: 100}}  onPress={savePhotoWithOverlay}>
                 <Ionicons
                    name="download"
                    size={30}
                    color="white"
                  
                  />
      
              </TouchableOpacity>
            </View>
 
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 75,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(248, 246, 246, 0.78)',
    padding: 10,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttons: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
});


 