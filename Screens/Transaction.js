import React from "react";
import {View, Text, StyleSheet} from "react-native";

export default class Transaction extends React.Component{
    render(){
        return(
            <View style={styles.container}>
                <Text style = {styles.text}>Tela de transação</Text>

            </View>
        )
    }
}

const styles= StyleSheet.create({
    container:{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#5653D4",
    },
    text:{
        color: "white",
        fontSize: 30,
    }
})