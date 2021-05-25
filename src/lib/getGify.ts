/* eslint-disable @typescript-eslint/no-explicit-any */
import Utils from '../Utils'; // Importing Utils to get JSON fetch function
// Main function: returns a Promise of type string
export const getGify = async(keyword: string): Promise<string> => {
    // Fetching gif json by providing keyword
    const data: any =  await Utils.fetch(`https://g.tenor.com/v1/search?q=${keyword}&key=LIVDSRZULELA&limit=8`, {})
    // Getting the required data from the object
    const gifUrls = data.results
    // Determining the length of the 'data' object
    const lengthOfData: number = gifUrls.length;
    // Using that length to randomize a number so that we will cover all possible indexes
    const randomIndex = Math.floor(Math.random() * lengthOfData)
    // Assigining the required data to URL const
    const URL = gifUrls[randomIndex].media[0].mp4.url
    // Returning the URL containing the link of the gif in mp4 format 
    return URL // Length: lengthOfData, Random: randomIndex 
}

// Side-note
// To get gif in other formats, I'd recommed you exploring the json itself which provided link returns.
// This stability of the url and API_KEY is not guaranteed 
// Regards ~ Somnath Das