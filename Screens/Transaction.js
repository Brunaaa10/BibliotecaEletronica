import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";

export default class Transaction extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            domState: "normal",
            scanned: false,
            hasCameraPermissions: null,
            scannedData: "",
        }
    }
    getCameraPermissions = async (domState) => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions: status == 'granted',
            domState: domState,
            scanned: false,
        })
    }
    handleBarcodeScanned = async ({ type, data }) => {
        this.setState({
            scannedData: data,
            domState: "normal",
            scanned: true,
        })
    }
    render() {
        const { domState, hasCameraPermissions, scanned, scannedData } = this.state
        if (domState == 'scanner') {
            return (
                <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : this.handleBarcodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
            )
        }
        return (
            <View style={styles.container}>
                <Text style={styles.buttonText}>
                    {hasCameraPermissions ? scannedData : "Dê permissão para acessar a câmera!!"}
                </Text>
                <TouchableOpacity onPress={() => this.getCameraPermissions("scanner")} style={styles.button}>
                    <Text>Digitalizar</Text>
                </TouchableOpacity>

            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#5653D4"
    },
    text: {
        color: "#ffff",
        fontSize: 15
    },
    button: {
        width: "43%",
        height: 55,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F48D20",
        borderRadius: 15
    },
    buttonText: {
        fontSize: 15,
        color: "#FFFFFF"
    }

});