/**
 * checkfront booking square payment
 * https://github.com/facebook/react-native
 * Author: Liam Turner-Heming
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {SQIPCore, SQIPCardEntry} from 'react-native-square-in-app-payments';
import {Modal, Platform, StyleSheet, Text, View, Button, ToastAndroid, AlertIOS,} from 'react-native';


type Props = {};
export default class App extends Component<Props> {
  constructor(){
    super();
    this.onStartCardEntry = this.onStartCardEntry.bind(this);
    this.onCardNonceRequestSuccess = this.onCardNonceRequestSuccess.bind(this);
    this.orderModalClose = this.orderModalClose.bind(this);
    this.startOrderModal = this.startOrderModal.bind(this);
    this.onPayPress = this.onPayPress.bind(this);
    //TODO: relate currency symbol to each currency type
    this.state = {checkoutTotal: 0, isShowingOrder: false, currencyType: 'CAD', currencySymbol: '\u0024', payPressed: false, payComplete: false, cardDetails: ''};
  }

   /**
   * Callback when the card entry is closed after call 'SQIPCardEntry.completeCardEntry'
   */
  onCardEntryComplete() {
    // Update UI to notify user that the payment flow is completed
  }

  /**
   * Callback when successfully get the card nonce details for processing
   * card entry is still open and waiting for processing card nonce details
   * @param {*} cardDetails
   */
  async onCardNonceRequestSuccess(cardDetails) {
    try {
      console.log(JSON.stringify(cardDetails));
      this.setState({cardDetails: cardDetails});
      // payment finished successfully
      // you must call this method to close card entry
      await SQIPCardEntry.completeCardEntry(
        this.onCardEntryComplete(),
      );
    } catch (ex) {
      // payment failed to complete due to error
      // notify card entry to show processing error
      await SQIPCardEntry.showCardNonceProcessingError(ex.message);
    }
  }

  chargeCard(cardDetails){
    //TODO: send card details to booking payment endpoint
    this.setState({payComplete: true});
  }

  startOrderModal(){
    this.setState({isShowingOrder: true});
    if (this.state.payPressed){
      chargeCard(this.state.cardDetails);
      if (this.state.payComplete){
        if (Platform.OS == 'android') {
          ToastAndroid.show('Payment Completed!', ToastAndroid.SHORT);
        } else if (Platform.OS == 'ios'){
          AlertIOS.alert(null, 'Payment Completed!');
        }
        this.orderModalClose();
      }
    }
  }

  /**
   * Callback when card entry is cancelled and UI is closed
   */
  onCardEntryCancel() {
    // Handle the cancel callback
    if (Platform.OS == 'android') {
      ToastAndroid.show('Payment Cancelled', ToastAndroid.SHORT);
    } else if (Platform.OS == 'ios'){
      AlertIOS.alert(null, 'Payment Cancelled');
    }
  }


  async componentDidMount(){
    await SQIPCore.setSquareApplicationId('sq0idp-ID55pdbMqg9Y4kwu8TiVfw');
    //TODO: replace host of URL with variable from login screen
    //fetch session details for payment
    fetch('https://camosuncapstone.checkfront.com/api/3.0/booking/session', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        }
      }).then((response) => response.json())
          .then((responseJson) => {
            this.setState({checkoutTotal: responseJson.booking.session.due, currencyType: responseJson.locale.currency});
          }).catch((error) => {
            console.error(error);
          });
  } 
   /**
   * An event listener to start card entry flow
   */
  async onStartCardEntry() {
    const cardEntryConfig = {
      collectPostalCode: false,
    };
    //callback to start card entry
    await SQIPCardEntry.startCardEntryFlow(
      cardEntryConfig,
      this.onCardNonceRequestSuccess,
      this.onCardEntryCancel,
    );
  }

  //self explanatory
  orderModalClose(){
    this.setState({isShowingOrder: false});
  }

  onPayPress(){
    this.setState({payPressed: true});
  }


  render() {
    return (
      <View style={styles.mainContainer}>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.isShowingOrder}
          onRequestClose={() => {
            if (Platform.OS == 'android') {
              ToastAndroid.show('Payment Cancelled', ToastAndroid.SHORT);
            } else if (Platform.OS == 'ios'){
              AlertIOS.alert(null, 'Payment Cancelled');
            }
          }}>
            <View style={styles.modal}>
              <View style={styles.payInfo}>
                <Text style={{color: 'white'}}>Your Total for this Booking: {this.state.currencySymbol}{this.state.checkoutTotal} {this.state.currencyType}</Text>
              </View>
              <Button style={styles.buttons} onPress={() => this.onPayPress()} title="Complete Payment"/>
              <Button style={styles.buttons} onPress={() => this.orderModalClose()} title="Cancel"/>
            </View>
        </Modal>
        <Button style={styles.buttons} onPress={this.startOrderModal} title="Pay"/>
        <Button style={styles.buttons} onPress={this.onStartCardEntry} title="Enter a Credit Card"/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  buttons: {
    color: '#2C97DE',

  },
  payInfo: {
    borderColor: '#2A3C51',
    borderStyle: 'solid',
    borderRadius: 2,
    backgroundColor: '#2C97DE',
    margin: 10
  }
});
