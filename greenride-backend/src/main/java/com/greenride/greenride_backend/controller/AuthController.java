package com.greenride.greenride_backend.controller;
import com.greenride.greenride_backend.dto.UserRegistrationRequest;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<String> registerUser (@RequestBody UserRegistrationRequest request){
        if(userService.findByEmail(request.getEmail()).isPresent()){
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }
        User newUser = new User(request.getName() , request.getEmail() , request.getPassword());
        userService.registerNewUser(newUser);
        return  ResponseEntity.ok("User registered successfully!");
    }
}
