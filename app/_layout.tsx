import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

export default function RootLayout() {

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
          // 1. Try to get last known position first for a faster response
          const lastKnown = await Location.getLastKnownPositionAsync({});
          if (lastKnown) {
            console.log("Using last known position");
            updateLocationDetails(lastKnown);
          }

          // 2. Try to get current position with a timeout and balanced accuracy for iOS
          // Accuracy.High can sometimes hang indefinitely on iOS indoors or in simulators
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            // @ts-ignore - timeout is available in some versions or via options
            timeout: 5000,
          });

          if (loc) {
            console.log("Using current position");
            updateLocationDetails(loc);
          }

        } catch (error) {
          console.log("Location error:", error);
          // If Balanced failed, try one more time with a lower accuracy if location is still null
          if (!location) {
            try {
              const lowAccLoc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Lowest,
              });
              if (lowAccLoc) updateLocationDetails(lowAccLoc);
            } catch (e) {
              console.log("Low accuracy location failed:", e);
            }
          }
        }
      }

      async function updateLocationDetails(loc: any) {
        try {
          const addressList = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          if (addressList && addressList.length > 0) {
            const addr = addressList[0];
            const formatted = addr.formattedAddress ||
              `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim().replace(/^,|,$/g, '');

            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              address: {
                formattedAddress: formatted || 'Address not found',
              },
            });
          } else {
            // Still set coordinates if geocoding fails
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              address: {
                formattedAddress: 'Address lookup failed',
              },
            });
          }
        } catch (err) {
          console.log("Reverse Geocode error:", err);
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            address: {
              formattedAddress: 'Geocoding Error',
            },
          });
        }
      }

      // Date & Time
      const now = new Date();
      setDate(now.toLocaleDateString());
      setTime(now.toLocaleTimeString());

    })();
  }, []);


  const sharePhoto = async () => {
    if (!viewShotRef.current) return;

    try {
      const uri = await viewShotRef.current.capture();



      if (!(await Sharing.isAvailableAsync())) {
        alert("Sharing is not available on this device");
        return;
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: "Share your photo",

      });

      setPhotoUri(null)
    } catch (error) {
      console.log("Share error:", error);
    }
  };

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
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  const isLoading = !location || !date || !time;

  const url = Platform.select({
    ios: `maps://0,0?q=${location?.latitude},${location?.longitude}`,
    android: `google.navigation:q=${location?.latitude},${location?.longitude}`,
    default: `https://www.google.com/maps/search/?api=1&query=${location?.latitude},${location?.longitude}`
  });

  const shareLocation = async () => {
    if (!location) {
      alert("Location not available");
      return;
    }

    const lat = location.latitude;
    const lng = location.longitude;

    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;

    try {
      await Share.share({
        message: `📍 My Location:\n${mapLink}`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>




      {isLoading ? <ActivityIndicator style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} size="large" color="white" /> : <TouchableOpacity hitSlop={{ top: 100, bottom: 100, left: 50, right: 50 }} style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={shareLocation} >
        <Ionicons
          name="location"
          size={30}
          color="white"

        />
      </TouchableOpacity>




      }

      {photoUri ? (

        <ViewShot ref={viewShotRef} style={{ flex: 1 }} options={{ format: 'jpg', quality: 1 }}>
          <Image source={{ uri: photoUri }} style={{ flex: 1 }} />


          <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', bottom: 130, flex: 1, }}>


            <View style={{
              backgroundColor: 'rgba(248, 246, 246, 0.78)',
              padding: 10,
              borderRadius: 8,
              width: '74%',
              marginStart: 5

            }}>


              <View>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{location ? location?.address?.formattedAddress : 'loading...'}</Text>
              </View>



              <View style={{ paddingHorizontal: 5, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{date ? `Date: ${date}` : 'loading...'}</Text>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{location ? `latitude: ${location?.latitude.toFixed(5)}` : 'loading...'}</Text>
              </View>

              <View style={{ paddingHorizontal: 5, flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{time ? `Time: ${time}` : 'loading...'}</Text>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{location ? `longitude: ${location?.longitude.toFixed(5)}` : 'loading...'}</Text>
              </View>







            </View>


            <TouchableOpacity
              onPress={() => Linking.openURL(url)}
            >
              <Image
                source={require('../assets/images/mapIcon.png')}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                  top: 3
                }}
              />


            </TouchableOpacity>
          </View>

        </ViewShot>
      ) : (




        <View style={{ flex: 1 }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mode="picture" />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', bottom: 175, flex: 1, }}>



            <View style={{
              backgroundColor: 'rgba(248, 246, 246, 0.78)',
              padding: 10,
              borderRadius: 8,
              width: '75%',
              marginStart: 5

            }}>


              <View>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{location ? location?.address?.formattedAddress : 'loading...'}</Text>
              </View>


              <View style={{ paddingHorizontal: 5, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{date ? `Date: ${date}` : 'loading...'}</Text>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{location ? `latitude: ${location?.latitude.toFixed(5)}` : 'loading...'}</Text>
              </View>


              <View style={{ paddingHorizontal: 5, flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{time ? `Time: ${time}` : 'loading...'}</Text>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>{location ? `longitude: ${location?.longitude.toFixed(5)}` : 'loading...'}</Text>
              </View>





            </View>


            <TouchableOpacity
              onPress={() => Linking.openURL(url)}
            >
              <Image
                source={require('../assets/images/mapIcon.png')}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                  top: 3
                }}
              />


            </TouchableOpacity>



          </View>
        </View>




      )}

      <View style={styles.buttons}>
        {!photoUri ? (




          <View>
            {isLoading ? (
              <View style={{ width: 55, height: 55, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : (


              <View style={{ borderWidth: 2, borderColor: 'white', borderRadius: 50, padding: 3 }}>
                <TouchableOpacity onPress={takePhoto} disabled={!location}>
                  <View style={{ width: 55, height: 55, borderRadius: 30, backgroundColor: 'white' }} />
                </TouchableOpacity>


              </View>
            )}

          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', width: '100%', bottom: 1, paddingHorizontal: 20 }}>





            <TouchableOpacity hitSlop={{ top: 25, bottom: 100, left: 50, right: 50 }} onPress={sharePhoto} >
              <Ionicons
                name="share-social"
                size={30}
                color="white"

              />
            </TouchableOpacity>


            <TouchableOpacity hitSlop={{ top: 25, bottom: 100, left: 50, right: 50 }} onPress={() => setPhotoUri(null)} >
              <Ionicons
                name="refresh"
                size={30}
                color="white"

              />
            </TouchableOpacity>


            <TouchableOpacity hitSlop={{ top: 25, bottom: 100, left: 50, right: 50 }} onPress={savePhotoWithOverlay}>
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

  text: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttons: {
    position: 'absolute',
    bottom: 75,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
});


