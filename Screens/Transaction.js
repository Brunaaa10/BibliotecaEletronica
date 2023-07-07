import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ImageBackground, ToastAndroid, Alert, Platform } from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../Config";
import firebase from "firebase";
var bgImg = require("../assets/background2.png");
var imgIcon = require("../assets/appIcon.png");
var appName = require("../assets/appName.png");


export default class Transaction extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            domState: "normal",
            scanned: false,
            hasCameraPermissions: null,
            scannedData: "",
            bookId: "",
            studentId: "",
            bookName: "",
            studentName: "",
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
        var { domState } = this.state
        if (domState == "bookId") {
            this.setState({
                bookId: data,
                domState: "normal",
                scanned: true,
            })
        } else if (domState == "studentId") {
            this.setState({
                studentId: data,
                domState: "normal",
                scanned: true,
            })
        }
    }

    handleTransactions = async () => {
        var { bookId, studentId } = this.state
        studentId = studentId.trim().toLowerCase();
        bookId = bookId.trim().toLowerCase();
        await this.getBookDetails(bookId);
        await this.getStudentDetails(studentId);
        db.collection("Books")
            .doc(bookId)
            .get()
            .then((doc) => {
                console.log(doc.data())
                var book = doc.data()
                var { bookName, studentName } = this.state
                if (book.is_book_available) {
                    this.initiateBookIssue(bookId, studentId, bookName, studentName)
                    if (Platform.OS == "android") {
                        ToastAndroid.show("Livro retirado com sucesso!!", ToastAndroid.SHORT)
                    } else {
                        Alert.alert("LIvro retirado com sucesso!!")
                    }
                } else {
                    this.initiateBookReturn(bookId, studentId, bookName, studentName)
                    if (Platform.OS == "android") {
                        ToastAndroid.show("Livro devolvido com sucesso!!", ToastAndroid.SHORT)
                    } else {
                        Alert.alert("LIvro devolvido com sucesso!!")
                    }
                }

            })
    }

    getBookDetails = (bookId) => {
        db.collection("books")
            .where("book_id", "==", bookId)
            .get()
            .then(snapshot => {
                snapshot.docs.map(doc => {
                    this.setState({
                        bookName: doc.data().book_name
                    })
                })
            })
    }

    getStudentDetails = studentId => {
        db.collection("students")
            .where("student_id", "==", studentId)
            .get()
            .then(snapshot => {
                snapshot.docs.map(doc => {
                    this.setState({
                        studentName: doc.data().student_name
                    });
                });
            });
    };

    initiateBookIssue = (bookId, studentId, bookName, studentName) => {
        //adicionando transação
        db.collection("transactions").add({
            student_id: studentId,
            student_name: studentName,
            book_id: bookId,
            book_name: bookName,
            date: firebase.firestore.Timestamp.now().toDate(),
            transaction_type: "issue"
        })
        //alterar status do livro
        db.collection("books")
            .doc(bookId)
            .update({
                is_book_available: false,
            })
        //alterar número de livros retirados pelo aluno
        db.collection("students")
            .doc(studentId)
            .update({
                number_of_books_issued: firebase.firestore.FieldValue.increment(1)
            })
        //atualizando os estados
        this.setState({
            bookId: "",
            studentId: ""
        })
    }

    initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
        //adicionar uma transação
        db.collection("transactions").add({
            student_id: studentId,
            student_name: studentName,
            book_id: bookId,
            book_name: bookName,
            date: firebase.firestore.Timestamp.now().toDate(),
            transaction_type: "return"
        });
        //alterar status do livro
        db.collection("books")
            .doc(bookId)
            .update({
                is_book_available: true
            });
        //alterar o número de livros retirados pelo aluno
        db.collection("students")
            .doc(studentId)
            .update({
                number_of_books_issued: firebase.firestore.FieldValue.increment(-1)
            });

        // Atualizando o estado local
        this.setState({
            bookId: "",
            studentId: ""
        });
    };

    render() {
        const { domState, hasCameraPermissions, scanned, scannedData, bookId, studentId } = this.state
        if (domState !== 'normal') {
            return (
                <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : this.handleBarcodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
            )
        }

        return (
            <View style={styles.container}>
                <ImageBackground source={bgImg} style={styles.bgImage}>

                    <View style={styles.lowerContainer}>
                        <View style={styles.textinputContainer}>
                            <TextInput style={styles.textinput}
                                placeholder={"ID livro"}
                                placeholderTextColor={"#FFF"}
                                value={bookId}
                                onChangeText={text=>{
                                    this.setState({
                                        bookId: text,
                                    })
                                }}>
                            </TextInput>
                            <TouchableOpacity onPress={() => this.getCameraPermissions("bookId")}
                                style={styles.scanbutton}>
                                <Text style={styles.scanbuttonText}>
                                    Scan
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.textinputContainer}>
                            <TextInput style={styles.textinput}
                                placeholder={"ID estudante"}
                                placeholderTextColor={"#FFF"}
                                value={studentId}
                                onChangeText={text=>{
                                    this.setState({
                                        studentId: text,
                                    })
                                }}>
                            </TextInput>
                            <TouchableOpacity onPress={() => this.getCameraPermissions("studentId")}
                                style={styles.scanbutton}>
                                <Text style={styles.scanbuttonText}>
                                    Scan
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.button} onPress={() => this.handleTransactions()}>
                            <Text style={styles.buttonText}>Enviar</Text>
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
            </View>

        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF"
    },
    bgImage: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center"
    },
    upperContainer: {
        flex: 0.5,
        justifyContent: "center",
        alignItems: "center"
    },
    appIcon: {
        width: 200,
        height: 200,
        resizeMode: "contain",
        marginTop: 80
    },
    appName: {
        width: 180,
        resizeMode: "contain"
    },
    lowerContainer: {
        flex: 0.5,
        alignItems: "center"
    },
    textinputContainer: {
        borderWidth: 2,
        borderRadius: 10,
        flexDirection: "row",
        backgroundColor: "#9DFD24",
        borderColor: "#FFFFFF"
    },
    textinput: {
        width: "57%",
        height: 50,
        padding: 10,
        borderColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 3,
        fontSize: 18,
        backgroundColor: "#5653D4",
        color: "#FFFFFF"
    },
    scanbutton: {
        width: 100,
        height: 50,
        backgroundColor: "#9DFD24",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: "center",
        alignItems: "center"
    },
    scanbuttonText: {
        fontSize: 20,
        color: "#0A0101",
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
        fontSize: 24,
        color: "#FFFFFF",
    }
});