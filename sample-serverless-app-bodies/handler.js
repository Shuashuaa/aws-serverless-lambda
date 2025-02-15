exports.hello = async (event) => {
  const sampleArrDate = [
    { name: 'juswa', surname: 'tania'},
    { name: 'arlou', surname: 'beloria'},
    { name: 'neil', surname: 'villanueva'}  
  ];

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Go Serverless v4! Your function executed successfully!",
      data: sampleArrDate
    }),
  };
};