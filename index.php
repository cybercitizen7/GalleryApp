<?php

// As query param I am sending the API URL
$q = $_REQUEST["q"];

if( $q !== "" ) {
    return fetchImages($q);
}

// To fetch images I use PHP's cUrl support
function fetchImages($url) {
    $curl = curl_init();

    curl_setopt($curl, CURLOPT_URL, $url);

    $result = curl_exec($curl);

    curl_close($curl);

    return json_encode($result);
}
?>