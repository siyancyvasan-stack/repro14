import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/shared/DashboardScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import * as Sales from '../screens/salesPerson';

const Tab = createBottomTabNavigator(); const Stack = createNativeStackNavigator();
const options = { headerShown: false };

function ShopStack() { return <Stack.Navigator><Stack.Screen name="ShopList" component={Sales.ShopListScreen} options={options} /><Stack.Screen name="ShopView" component={Sales.ShopViewScreen} /><Stack.Screen name="ShopNew" component={Sales.ShopNewScreen} /></Stack.Navigator>; }
function OrderStack() { return <Stack.Navigator><Stack.Screen name="OrderList" component={Sales.OrderListScreen} options={options} /><Stack.Screen name="OrderView" component={Sales.OrderViewScreen} /><Stack.Screen name="OrderNew" component={Sales.OrderNewScreen} /><Stack.Screen name="OrderEdit" component={Sales.OrderEditScreen} /></Stack.Navigator>; }
function VisitStack() { return <Stack.Navigator><Stack.Screen name="VisitList" component={Sales.VisitListScreen} options={options} /><Stack.Screen name="VisitCheckIn" component={Sales.VisitCheckInScreen} /><Stack.Screen name="ActiveVisit" component={Sales.ActiveVisitScreen} /></Stack.Navigator>; }
export function SalesPersonNavigator() { return <Tab.Navigator screenOptions={options}><Tab.Screen name="Dashboard" component={DashboardScreen} /><Tab.Screen name="Shops" component={ShopStack} /><Tab.Screen name="Orders" component={OrderStack} /><Tab.Screen name="Visits" component={VisitStack} /><Tab.Screen name="More" component={ProfileScreen} /></Tab.Navigator>; }
