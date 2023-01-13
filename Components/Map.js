import {useEffect,useState,useRef} from 'react';
import MapView from 'react-native-maps';
import { Marker,Polyline } from 'react-native-maps';
import { StyleSheet, View,Text,TouchableOpacity } from 'react-native';
import {watchPositionAsync,requestForegroundPermissionsAsync, getCurrentPositionAsync, Accuracy,enableNetworkProviderAsync} from 'expo-location'
import haversine from 'haversine';


export default function App() {
  
  const [accu, Setaccu] = useState(0)
  const [lat ,Setlat] =useState(0)
  const [long ,Setlong] =useState(0)
  const [ready, Setready] = useState(false)
  const [Listener, SetL] = useState()
  const [start,Setstart] = useState(false)
  const lis = useRef([])
  const dis = useRef(0)
  const lastpos = useRef()

  useEffect(()=>{
    const perm =async ()=>{
      const {status} = await requestForegroundPermissionsAsync()
      await enableNetworkProviderAsync()
      if(status == 'granted'){
       let position = (await getCurrentPositionAsync({accuracy:Accuracy.Highest}))
       Setlat(position.coords.latitude)
       Setlong(position.coords.longitude)
       Setaccu(position.coords.accuracy)
       lastpos.current = {latitude:position.coords.latitude,longitude:position.coords.longitude}
       lis.current.push({latitude:position.coords.latitude,longitude:position.coords.longitude})
       Setready(true)
      }
      else{
        alert('Unable to access location services')
      }
    }
    perm()
  },[])

  const handlepress = async()=>{
    if(!start){
      lastpos.current = {latitude:lat,longitude:long}
      SetL(await watchPositionAsync({accuracy:Accuracy.Highest,timeInterval:1000,distanceInterval:1},(position)=>{positionupdate(position)}))
      Setstart(true)
    }
    else{
      Listener.remove()
      lis.current= ([])
      dis.current = (0)
      Setstart(false)
    }
  }
  const positionupdate =(position)=>{
    lis.current = lis.current.concat([{latitude:position.coords.latitude,longitude:position.coords.longitude}])
    const Distance = haversine(lastpos.current,{latitude:position.coords.latitude,longitude:position.coords.longitude},{unit:'meter'})
    lastpos.current = {latitude:position.coords.latitude,longitude:position.coords.longitude}
    dis.current = dis.current + Distance
    Setlat(position.coords.latitude)
    Setlong(position.coords.longitude)
    Setaccu(position.coords.accuracy)
  }

  return (
    <View style={styles.container}>
      {
        ready? <MapView 

        style={styles.map}

        initialRegion={{
          latitude: lat,
          longitude: long,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }}
        >
          <Marker
          coordinate={{
            longitude: long,
            latitude: lat
          }}
          />
          <Polyline
          coordinates={lis.current}
          strokeWidth={10}
          strokeColor='#ff7f51'
          
          />

        </MapView>:<Text>Loading</Text>
      }
      <Text style={{fontSize:20,marginLeft:'25%',marginTop:'5%'}}>Deviation:{Math.round(accu*100)/100} meters</Text>
      <Text style={{fontSize:30,marginLeft:'25%',marginTop:'25%'}}>Distance:{Math.round(dis.current*100)/100} meters</Text>
      <TouchableOpacity style={{backgroundColor:'blue',width:'40%',marginLeft:'30%',marginTop:'25%',borderRadius:20}} onPress={()=>{handlepress()}}>
        <Text style={{textAlign:'center',color:'white',fontSize:30}}>{start? 'Stop':'Start'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '40%',
    marginTop:50
  },
});