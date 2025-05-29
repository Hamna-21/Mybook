# include <iostream>
using namespace std;
void SelectionSort(int arr[],int n){
	for (int i=0;i<n-1;i++){
		int minIndex=i;
		for(int j=i+1;j<n;j++){
			if(arr[j]<arr[minIndex]){
				minIndex=j;
			}
		}
	
	
	if(minIndex !=i){
		int temp=arr[i];
		arr[i]=arr[minIndex];
		arr[minIndex]=temp;
		
	}
}
}
void displayArray(int arr[],int n){
	for(int i=0;i<n;i++){
		cout<<arr[i]<<" ";
	}
	cout<<endl;
}
int main(){
	int arr[]={12,43,2,3,65,7};
	int n=sizeof(arr)/sizeof(arr[0]);
	
	 cout << "Original array: ";
    displayArray(arr, n);
    
    SelectionSort(arr, n);
    
    cout << "Sorted array: ";
    displayArray(arr, n);
	
}