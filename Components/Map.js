import {useEffect,useState,useRef} from 'react';
import MapView from 'react-native-maps';
import { Marker,Polyline ,PROVIDER_GOOGLE} from 'react-native-maps';
import { StyleSheet, View,Text,TouchableOpacity, Modal } from 'react-native';
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
  const firstpos = useRef()
  const dis = useRef(0)
  const lastpos = useRef()
  const [m,Setm] = useState(false)
  const [area,setarea] = useState(0)

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

  function calculateAreaInSquareMeters(x1, x2, y1, y2) {
    return (y1 * x2 - x1 * y2) / 2;
  }
    
  function calculateYSegment(latitudeRef, latitude, circumference) {
    return (latitude - latitudeRef) * circumference / 360.0;
  }
    
  function calculateXSegment(longitudeRef, longitude, latitude, circumference) {
    return (longitude - longitudeRef) * circumference * Math.cos((latitude * (Math.PI / 180))) / 360.0;
  }

  const CalculateArea = (locations) =>{
    if (!locations.length) {    
      return 0;
    
    }
    if (locations.length < 3) {
      return 0;
    }

    let radius = 6371000;
    
    const diameter = radius * 2;
    const circumference = diameter * Math.PI;
    const listY = [];
    const listX = [];
    const listArea = [];
    // calculate segment x and y in degrees for each point
    
    const latitudeRef = locations[0].latitude;
    const longitudeRef = locations[0].longitude;
    for (let i = 1; i < locations.length; i++) {
      let latitude = locations[i].latitude;
      let longitude = locations[i].longitude;
      listY.push(calculateYSegment(latitudeRef, latitude, circumference));
    
      listX.push(calculateXSegment(longitudeRef, longitude, latitude, circumference));
    
    }
    
    // calculate areas for each triangle segment
    for (let i = 1; i < listX.length; i++) {
      let x1 = listX[i - 1];
      let y1 = listY[i - 1];
      let x2 = listX[i];
      let y2 = listY[i];
      listArea.push(calculateAreaInSquareMeters(x1, x2, y1, y2));
    
    }
    
    // sum areas of all triangle segments
    let areasSum = 0;
    listArea.forEach(area => areasSum = areasSum + area)
    
    // get abolute value of area, it can't be negative
    let areaCalc = Math.abs(areasSum);// Math.sqrt(areasSum * areasSum);  
    return areaCalc;
  }

  const handlepress = async()=>{
    if(!start){
      lis.current= ([])
      dis.current = (0)
      lastpos.current = {latitude:lat,longitude:long}
      firstpos.current = {latitude:lat,longitude:long}
      lis.current = lis.current.concat([firstpos.current])
      SetL(await watchPositionAsync({accuracy:Accuracy.Highest,timeInterval:1000,distanceInterval:1},(position)=>{positionupdate(position)}))
      Setstart(true)
    }
    else{
      lis.current = lis.current.concat([firstpos.current])
      Listener.remove()
      Setstart(false)
    }
  }
  const positionupdate =(position)=>{
    if( position.coords.accuracy < 100){
      lis.current = lis.current.concat([{latitude:position.coords.latitude,longitude:position.coords.longitude}])
      const Distance = haversine(lastpos.current,{latitude:position.coords.latitude,longitude:position.coords.longitude},{unit:'meter'})
      lastpos.current = {latitude:position.coords.latitude,longitude:position.coords.longitude}
      dis.current = dis.current + Distance
      Setlat(position.coords.latitude)
      Setlong(position.coords.longitude)
      Setaccu(position.coords.accuracy)}
  }


  return (
    <View style={styles.container}>
      {
        ready? <MapView 
        provider={PROVIDER_GOOGLE}
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
      {start? <View></View>:<View>
      <TouchableOpacity style={{backgroundColor:'blue',width:'40%',marginLeft:'30%',marginTop:'5%',borderRadius:20}} onPress={()=>{
        let arra =lis.current.slice(0,-1)
        console.log(arra)
        setarea(CalculateArea(arra))
        Setm(true)
      }}>
        <Text style={{textAlign:'center',color:'white',fontSize:30}}>Submit</Text>
      </TouchableOpacity>
      <Modal 
      visible={m}
      animationType='slide'
      onRequestClose={()=>{Setm(false)}}
      >
        <View style={{justifyContent:'center',flex:1,alignItems:'center'}}>
          <Text>Plot Perimeter:{Math.round(dis.current*100)/100} meters</Text>
          <Text>Plot Perimeter:{Math.round(area*100)/100} meters squared</Text>
        </View>
      </Modal>
      </View>}
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