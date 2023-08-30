import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Moment from 'moment';
import NfcManager,  {NfcEvents,Ndef,NfcTech, TagEvent}  from 'react-native-nfc-manager';


enum LottieType{
  None,
  Searching,
  Error,
  Ok
}
export default function App() {
  const [tagId, setTagId] = useState<string | null>(null);
  const [techTypes, setTechTypes] = useState<string[] | null>(null);
  const [isNFCRequesting, setIsNFCRequesting] = useState(false); // Adicione o estado

  const decodeNdefRecord = record => {
    if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
      return ["text", Ndef.text.decodePayload(record.payload)];
    }
    if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
      return ["uri", Ndef.uri.decodePayload(record.payload)];
    }
  
    return ["unknown", "---"];
  };


  const readNdef = async () => {
    if (isNFCRequesting) {
      return; // Evitar solicitações concorrentes
    }
    setIsNFCRequesting(true); // Marcar que uma solicitação está em andamento

    let tag: TagEvent | null;
    let parsed = null;
    try {
      
      const status = await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NdefFormatable]);
      tag = await NfcManager.getTag();
      if (tag) {
        await NfcManager.ndefHandler.getNdefStatus();
        if (Platform.OS === 'ios') {
          await NfcManager.setAlertMessageIOS('I got your tag!');
        }
        console.log('tag', tag);
        console.log('status', status);
        setTagId(tag.id);

        if (tag.techTypes.includes(NfcTech.NdefFormatable)) {
          // Use o método transceive para ler dados da tag NdefFormatable
          const response = await NfcManager.transceive('read'); // Passe os comandos apropriados aqui
          console.log('Resposta da tag NdefFormatable:', response);
        } else {
          console.log('Tag não suporta NdefFormatable');
        }

      }
      

    } catch (ex) {
      console.warn('ex', ex);
    } finally {
      setIsNFCRequesting(false);
      NfcManager.cancelTechnologyRequest();
    }
  };

  const hasSupportNFC = async () => {
    const isSupported = await NfcManager.isSupported();
    console.log('isSupported', isSupported);
    if (!isSupported) {
      console.log('NFC não suportado');
      setTimeout(() => {
        console.log('NFC não suportado2');
      },500);
      return;
    }
    await NfcManager.start();
    readNdef();
  };

  const findNtrackerByTag = async (tag: string) => {
    console.log('findNtrackerByTag', tag);
  }

  useEffect(() => {
    Moment.locale('pt-br');
    hasSupportNFC();

    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    }
  }, []);

  

  return (
    <View style={{ padding: 20 }}>
      {/* ... (resto do JSX) */}
      <TouchableOpacity
        style={{
          padding: 10,
          backgroundColor: isNFCRequesting ? 'gray' : '#0099CC', // Desabilitar o botão se uma solicitação estiver em andamento
          marginBottom: 10,
        }}
        onPress={readNdef}
        disabled={isNFCRequesting} // Desabilitar o botão enquanto uma solicitação estiver em andamento
      >
        <Text style={{ color: '#FFF' }}>Start NFC</Text>
      </TouchableOpacity>
      {/* ... (resto do JSX) */}
    </View>
  );
}