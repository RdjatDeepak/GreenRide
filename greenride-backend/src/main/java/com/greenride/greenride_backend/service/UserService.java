package com.greenride.greenride_backend.service;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.model.Role;
import com.greenride.greenride_backend.model.ERole;
import com.greenride.greenride_backend.repository.RoleRepository;
import com.greenride.greenride_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerNewUser(User user){
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        //default user Role is user
        Set<Role> roles= new HashSet<>();
        Role userRole= roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(()-> new RuntimeException("Error : User Role not Found"));
        roles.add(userRole);
        user.setRoles(roles);
        return userRepository.save(user);
    }
    public Optional<User> findByEmail(String email){
        return userRepository.findByEmail(email);
    }
}
