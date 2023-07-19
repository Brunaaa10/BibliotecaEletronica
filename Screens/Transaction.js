import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ImageBackground, ToastAndroid, Alert, Platform, KeyboardAvoidingView } from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../Config";
import firebase from "firebase";
var bgImg = require("../assets/background2.png");
var appIcon = require("../assets/appIcon.png");
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
        var transactionType = await this.checkBookAvailability(bookId)
        var { bookName, studentName } = this.state
        if (!transactionType) {
            if (Platform.OS == "android") {
                ToastAndroid.show("Livro não encontrado!!", ToastAndroid.SHORT)
            } else {
                Alert.alert("Livro não encontrado!!")
            }
            this.setState({
                bookId: "",
                studentId: "",
            })
        }
        else if (transactionType == "issue") {
            var isElegible = await this.checkStudentEligibilityForBookIssue(studentId)
            if (isElegible) {
                this.initiateBookIssue(bookId, studentId, bookName, studentName)
                if (Platform.OS == "android") {
                    ToastAndroid.show("Livro retirado com sucesso!!", ToastAndroid.SHORT)
                } else {
                    Alert.alert("LIvro retirado com sucesso!!")
                }
            }
        } else if (transactionType == "return") {
            var isElegible = await this.checkStudentEligibilityForBookReturn(bookId, studentId)
            if (isElegible) {
                this.initiateBookReturn(bookId, studentId, bookName, studentName)
                if (Platform.OS == "android") {
                    ToastAndroid.show("Livro devolvido com sucesso!!", ToastAndroid.SHORT)
                } else {
                    Alert.alert("Livro devolvido com sucesso!!")
                }
            }
        }



    };

    getBookDetails = (bookId) => {
        db.collection("Books")
            .where("book_id", "==", bookId)
            .get()
            .then(snapshot => {
                snapshot.docs.map(doc => {
                    this.setState({
                        bookName: doc.data().book_name
                    })
                })
            })
    };

    getStudentDetails = studentId => {
        db.collection("Students")
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
        db.collection("Transactions").add({
            student_id: studentId,
            student_name: studentName,
            book_id: bookId,
            book_name: bookName,
            date: firebase.firestore.Timestamp.now().toDate(),
            transaction_type: "issue"
        })
        //alterar status do livro
        db.collection("Books")
            .doc(bookId)
            .update({
                is_book_available: false,
            })
        //alterar número de livros retirados pelo aluno
        db.collection("Students")
            .doc(studentId)
            .update({
                number_of_books_issued: firebase.firestore.FieldValue.increment(1)
            })
        //atualizando os estados
        this.setState({
            bookId: "",
            studentId: ""
        })
    };

    initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
        //adicionar uma transação
        db.collection("Transactions").add({
            student_id: studentId,
            student_name: studentName,
            book_id: bookId,
            book_name: bookName,
            date: firebase.firestore.Timestamp.now().toDate(),
            transaction_type: "return"
        });
        //alterar status do livro
        db.collection("Books")
            .doc(bookId)
            .update({
                is_book_available: true
            });
        //alterar o número de livros retirados pelo aluno
        db.collection("Students")
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

    checkBookAvailability = async (bookId) => {
        var bookRef = await db.collection("Books")
            .where('book_id', "==", bookId).get()

        var transactionType = ""
        if (bookRef.docs.length == 0) {
            transactionType = false
        } else {
            bookRef.docs.map(doc => {
                transactionType = doc.data().is_book_available ? "issue" : "return"
            })
        }
        return transactionType
    };

    checkStudentEligibilityForBookIssue = async (studentId) => {
        var studentRef = await db.collection("Students")
            .where("student_id", "==", studentId).get()

        var isStudentElegible = ""
        if (studentRef.docs.length == 0) {
            this.setState({
                bookId: "",
                studentId: ""
            });
            isStudentElegible = false

            if (Platform.OS == "android") {
                ToastAndroid.show("Estudante não encontrado!!", ToastAndroid.SHORT)
            } else {
                Alert.alert("Estudante não encontrado!!")
            }

        } else {
            studentRef.docs.map(doc => {
                if (doc.data().number_of_books_issued < 2) {
                    isStudentElegible = true
                    if (studentRef.docs.lemgth == 0) {
                        this.setState({
                            bookId: "",
                            studentId: ""
                        });
                    } else {
                        isStudentElegible = false
                        this.setState({
                            bookId: "",
                            studentId: "",
                        })
                        if (Platform.OS == "android") {
                            ToastAndroid.show("Estudante já retirou dois livros!!", ToastAndroid.SHORT)
                        } else {
                            Alert.alert("Estudante já retirou dois livros!!")
                        }
                    }}
                })
        }
        return isStudentElegible
    };

    checkStudentEligibilityForBookReturn = async (bookId, studentId) => {
        var transactionRef = await db.collection("Transactions")
            .where("book_id", "==", bookId).limit(1).get()

        var isStudentElegible = ""

        transactionRef.docs.map(doc => {
            var lastBookTransaction = doc.data()
            if (lastBookTransaction.student_id == studentId) {
                isStudentElegible = true
            } else {
                isStudentElegible = false
                this.setState({
                    bookId: "",
                    studentId: ""
                })
                Alert.alert("Livro não foi retirado por este aluno")
            }
        })
        return isStudentElegible
    }

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
            <KeyboardAvoidingView behavior="padding" style={styles.container}>
                <ImageBackground source={bgImg} style={styles.bgImage}>
                    <View style={styles.upperContainer}>
                        <Image source={appIcon} style={styles.appIcon} />
                        <Image source={appName} style={styles.appName} />
                    </View>
                    <View style={styles.lowerContainer}>
                        <View style={styles.textinputContainer}>
                            <TextInput style={styles.textinput}
                                placeholder={"ID livro"}
                                placeholderTextColor={"#FFF"}
                                value={bookId}
                                onChangeText={text => {
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
                                onChangeText={text => {
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
            </KeyboardAvoidingView>

        )
    };
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