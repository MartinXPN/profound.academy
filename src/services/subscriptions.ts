import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export const subscribe = async (
    userId: string, priceId: string, backUrl: string,
    onSuccess: (redirectUrl: string) => void, onError: (error: Error) => void,
) => {
    const ref = await firebase.firestore()
        .collection(`subscriptions/${userId}/checkout_sessions`)
        .add({
            price: priceId,
            success_url: backUrl,
            cancel_url: backUrl,
            automatic_tax: true,
        });

    return ref.onSnapshot(snapshot => {
        // @ts-ignore
        const {error, url} = snapshot.data();
        if( error ) return onError(error);
        if( url )   return onSuccess(url);
    });
}
