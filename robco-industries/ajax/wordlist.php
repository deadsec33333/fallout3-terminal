<?php
header('Content-Type: application/json');

$data = [
    "words" => ["BULLRUN", "BITCOIN", "NETWORK", "AIPROTO", "DEFENSE", "GATEWAY", "CONSOLE", "ROSWELL", "VACCINE"],
    "debug" => [
        "requested_length" => 7,
        "requested_count" => 12,
        "total_words" => 27,
        "matching_words" => ["BULLRUN", "BITCOIN", "NETWORK", "AIPROTO", "DEFENSE", "GATEWAY", "CONSOLE", "ROSWELL", "VACCINE"]
    ]
];

echo json_encode($data);
?>
